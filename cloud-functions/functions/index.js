let functions = require('firebase-functions');
const admin = require('firebase-admin');
let firebase = admin.initializeApp(functions.config().firebase);
let FABRIC_API='104.198.240.210';
let API_KEY = 'AIzaSyAUWhZClYHv8p6cdREZ-YJS_IS7njmXgzo';
let http = require('http');


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
                let callbackRef = "/fabric-tx/ballot/"+evtPayload.owner+"/"+ballotId;

                let payload = {
                    userId: evtPayload.owner,
                    firebaseId: ballotId,
                    ballot: evtPayload.config,
                    callbackRef: callbackRef
                };

                firebase.database().ref(callbackRef).set({
                    status: "pending",
                    callbackRef: callbackRef,
                    error: "",
                    timestamp: event.timestamp,
                    payload: payload
                });

               return createBallot(payload).then((fabricBallot)=>{
                   let configIdPath = '/ballot-configs/'+ballotId+"/config";
                   let configListIdPath = '/ballot-config-lists/'+evtPayload.owner+'/'+ballotId+'/config';
                   let txPath = callbackRef+'/fabricBallot';
                   let ballotResults = '/ballot-results/' + ballotId;

                   let newBallot = {};
                   for (let key in fabricBallot) {
                       if (fabricBallot.hasOwnProperty(key) && key != 'Decisions') {
                            newBallot[key] = fabricBallot[key];
                       }
                   }
                   let newDecisions = fabricBallot.Decisions;

                   let newConfig = {
                       "Ballot": newBallot,
                       "Decisions": newDecisions
                   };

                   //results
                   let resultsObj = {
                       owner: evtPayload.owner,
                       id: ballotId,
                       Id: fabricBallot.Id,
                       decisions: {}
                   };

                   for(let decision of fabricBallot.Decisions){
                       let decisionResults = { decision: decision};
                       let thisResult = {};
                       for(let option of decision.Options){
                           thisResult[option.Id] = 0;
                       }
                       decisionResults['results'] = thisResult;
                       resultsObj.decisions[decision.Id] = decisionResults;
                   }

                   let updates = {};
                   updates[configIdPath] = newConfig;
                   updates[configListIdPath] = newConfig;
                   updates[txPath] = fabricBallot;
                   updates[ballotResults] = resultsObj;

                   return firebase.database().ref().update(updates);
               });
            }
});

exports.commitBallot = functions.database.ref('/fabric-tx/ballot/{userId}/{ballotId}')
    .onWrite(event => {
        if (!event.data.exists()) {
            console.log("TX DELETE");
            //TODO: DELETE
        }if (event.data.val().status == "pending") {
            console.log("Waiting on TX callback");
            //TODO: UPDATE (keep Ids)
        }else{
            let evtPayload = event.data.val();
            if(evtPayload != null) {
                let ballotId = event.params.ballotId;
                let userId = event.params.userId;

                let updates = {};
                let ballotConfigStatus = '/ballot-configs/' + ballotId+'/status';
                let ballotConfigListStatus = '/ballot-config-lists/' + userId + '/' + ballotId+'/status';

                updates[ballotConfigStatus] = evtPayload.status;
                updates[ballotConfigListStatus] = evtPayload.status;

                return firebase.database().ref().update(updates);
            }
        }
    });


function createBallot(payload){
    return new Promise((resolve, reject) => {
        console.log("BALLOT CREATE: ", JSON.stringify(payload));

        let options = {
            hostname: FABRIC_API,
            path: "/api/v1/ballot",
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
                    resolve(JSON.parse(body));
                }catch(e){
                    reject(e)
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