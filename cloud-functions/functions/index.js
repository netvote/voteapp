let functions = require('firebase-functions');
const admin = require('firebase-admin');
let firebase = admin.initializeApp(functions.config().firebase);
let FABRIC_API="104.154.202.247";
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
                    let fabricId = fabricBallot.Id;
                    let configIdPath = '/ballot-configs/'+ballotId+"/config/Ballot/Id";
                    let configListIdPath = '/ballot-config-lists/'+evtPayload.owner+'/'+ballotId+'/config/Ballot/Id';

                    let updates = {};
                    updates[configIdPath] = fabricId;
                    updates[configListIdPath] = fabricId;
                    return firebase.database().ref().update(updates);
               });
                // invoke remote API
                // get results and update firebase (Ids)
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
            let ballotId = event.params.ballotId;
            let userId = event.params.userId;

            if(evtPayload != null) {
                firebase.database().ref('/ballot-configs/' + ballotId).update({status: evtPayload.status})
                    .then(() => {
                        firebase.database().ref('/ballot-config-lists/' + userId + '/' + ballotId).update({status: evtPayload.status})
                    }).then(() => {
                    event.data.ref.remove((r) => {
                    })
                });
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
                'Content-Type': 'application/json'
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