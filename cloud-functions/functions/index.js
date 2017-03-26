let functions = require('firebase-functions');
const admin = require('firebase-admin');
let firebase = admin.initializeApp(functions.config().firebase);
const FABRIC_API = functions.config().netvote.apihost;
const API_KEY = functions.config().netvote.apikey;
let http = require('http');
let uuid = require("uuid/v4");

// all fabric transactions have a callback firebase object
function buildTXObject(userId, functionName, triggerRefPath, triggerObject, triggerObjectId, payload){
    let txId = uuid();
    let obj = {
        txId: txId,
        uid: userId,
        timestamp: new Date(),
        invocation: functionName,
        triggerObject: {
            id: triggerObjectId,
            refPath: triggerRefPath,
            object: triggerObject
        },
        payload: payload,
        txRefPath: "/fabric-tx/"+functionName+"/"+txId,
        status: "pending",
        apiResponse: {}
    };
    firebase.database().ref(obj.txRefPath).set(obj);
    return obj;
}

exports.saveBallot = functions.database.ref('/ballot-configs/{ballotId}')
        .onWrite(event => {
            // Exit when the data is deleted.

            console.log('event: ', JSON.stringify(event));

            let evtPayload = event.data.val();

            if (event.data.previous.exists()) {
                console.log("BALLOT UPDATE");
                //TODO: UPDATE (keep Ids)
            }
            else if (!event.data.exists()) {
                console.log("BALLOT DELETE");
                //TODO: DELETE
            }else{
                //TODO: CREATE
                let ballotId = event.params.ballotId;

                let userId = evtPayload.owner;
                let functionName = "add_ballot";
                let triggerRefPath = "/ballot-configs/"+ballotId;
                let triggerObject = event.data.val();
                let payload = evtPayload.config;
                let txObject = buildTXObject(userId, functionName, triggerRefPath, triggerObject, ballotId, payload);
                if(!payload.Ballot.Attributes){
                    payload.Ballot.Attributes = {}
                }
                payload.Ballot.Attributes["ballotId"] = ballotId;

                return postNetvoteAPI("ballot", { payload: payload, txRefPath: txObject.txRefPath}).then((fabricBallot)=>{
                   let configIdPath = '/ballot-configs/'+ballotId+"/config";
                   let configListIdPath = '/ballot-config-lists/'+evtPayload.owner+'/'+ballotId+'/config';
                   let ballotResults = '/ballot-results/' + ballotId;

                   let newBallot = {};
                   for (let key in fabricBallot) {
                       if (fabricBallot.hasOwnProperty(key) && key !== 'Decisions') {
                            newBallot[key] = fabricBallot[key];
                       }
                   }

                   let newDecisions = fabricBallot.Decisions;

                   let newConfig = {
                       "Ballot": newBallot,
                       "Decisions": newDecisions
                   };

                   let resultsObj = {
                       owner: evtPayload.owner,
                       Id: fabricBallot.Id,
                       decisions: {}
                   };

                   for(let decision of fabricBallot.Decisions){
                       let decisionResults = { config: decision};
                       resultsObj.decisions[decision.Id] = decisionResults;
                       let thisResult = {};
                       for(let option of decision.Options){
                           thisResult[option.Id] = 0;
                       }
                       decisionResults['results'] = {"ALL": thisResult};
                       resultsObj.decisions[decision.Id] = decisionResults;
                   }

                   let updates = {};
                   updates[configIdPath] = newConfig;
                   updates[configListIdPath] = newConfig;
                   updates[txObject.txRefPath+'/apiResponse'] = fabricBallot;
                   updates[ballotResults] = resultsObj;

                   return firebase.database().ref().update(updates);
               });
            }
});

exports.castVote = functions.database.ref('/votes/{userId}/{ballotId}/{txId}/vote')
    .onWrite(event => {
        console.log('event: ', JSON.stringify(event));
        if (event.data.previous.exists()) {
            //TODO: UPDATE
        }
        else if (!event.data.exists()) {
            //TODO: DELETE
        }else {
            let userId = event.params.userId;
            let functionName = "cast_vote";
            let triggerRefPath = "/votes/" + userId + "/" + event.params.ballotId + "/" + event.params.txId + "/vote";
            let triggerObject = event.data.val();
            let payload = event.data.val();
            payload["VoterId"] = userId;

            let txObject = buildTXObject(userId, functionName, triggerRefPath, triggerObject, event.params.txId, payload);

            return postNetvoteAPI("castVote", {payload: payload, txRefPath: txObject.txRefPath}).then((result) => {
                let updates = {};
                updates[txObject.txRefPath + '/apiResponse'] = result;
                return firebase.database().ref().update(updates);
            }).catch((responseJson) => {
                let updates = {};
                updates[txObject.txRefPath + '/apiResponse'] = responseJson;
                updates[txObject.txRefPath + '/status'] = "error";
                updates["/votes/" + userId + "/" + event.params.ballotId + "/" + event.params.txId + "/status"] = "error";
                updates["/votes/" + userId + "/" + event.params.ballotId + "/" + event.params.txId + "/message"] = responseJson.Message;
                return firebase.database().ref().update(updates);
            });
        }
    });

exports.commitVote = functions.database.ref('/fabric-tx/cast_vote/{txId}').onWrite(event => {
    if (!event.data.exists()) {
        console.log("fabrix-tx vote delete: "+event.params.txId);
        //TODO: DELETE
    }if (event.data.val().status === "pending") {
        console.log("pending vote: "+event.params.txId)
        //TODO: NOTHING HERE
    }else if(event.data.val().status === "success") {
        let txObject = event.data.val();
        return firebase.database().ref(txObject.triggerObject.refPath).parent.update({ status: "success" })
    }else{
        console.error("commitVote status was not success: "+JSON.stringify(event.data.val()));
    }
});

exports.commitBallot = functions.database.ref('/fabric-tx/add_ballot/{txId}').onWrite(event => {
    if (!event.data.exists()) {
        console.log("TX DELETE");
        //TODO: DELETE
    }if (event.data.val().status === "pending") {
        console.log("PENDING!")
        //TODO: NOTHING HERE
    }else{
        let txObject = event.data.val();
        if(txObject) {
            let ballotId = txObject.triggerObject.id;
            let userId = txObject.uid;

            let updates = {};
            let ballotConfigStatus = '/ballot-configs/' + ballotId+'/status';
            let ballotConfigListStatus = '/ballot-config-lists/' + userId + '/' + ballotId+'/status';

            updates[ballotConfigStatus] = txObject.status;
            updates[ballotConfigListStatus] = txObject.status;

            console.log(event.params.txId+" - transaction complete");

            return firebase.database().ref().update(updates);
        }
    }
});


function postNetvoteAPI(endpoint, payload){
    return new Promise((resolve, reject) => {

        let apiPath = "/api/v1/"+endpoint;
        console.log("NETVOTE POST: "+apiPath+", "+JSON.stringify(payload));

        let options = {
            hostname: FABRIC_API,
            path: apiPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            }
        };

        let req = http.request(options, function(res){
            let body = '';
            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                body += chunk;
            });

            res.on('end', function(){
                console.log("fabric response: "+body);
                try{
                    //TODO: handle JSON errors
                    if(res.statusCode == 200) {
                        resolve(JSON.parse(body));
                    }else{
                        reject(JSON.parse(body));
                    }
                }catch(e){
                    console.error(e);
                    reject({Code: 500, Message: "Internal Error"})
                }
            });
        });

        req.on('error', function(e){
            reject(e);
        });

        // write data to request body
        req.write(JSON.stringify(payload));
        req.end();
    });
}

