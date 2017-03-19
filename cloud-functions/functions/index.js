let functions = require('firebase-functions');
const admin = require('firebase-admin');
let firebase = admin.initializeApp(functions.config().firebase);

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
                let payload = {
                    userId: evtPayload.owner,
                    firebaseId: ballotId,
                    ballot: evtPayload.config
                };

                let callbackRef = "/fabric-tx/ballot/"+evtPayload.owner+"/"+ballotId;
                firebase.database().ref(callbackRef).set({
                    status: "pending",
                    callbackRef: callbackRef,
                    error: "",
                    timestamp: event.timestamp,
                    payload: payload
                });

                return createBallot(payload);
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

            let updates = {};

            updates['/ballot-configs/'+ballotId] = {status: evtPayload.status};
            updates['/ballot-config-lists/'+userId+'/'+ballotId] = {status: evtPayload.status};

            return firebase.database().ref().update(updates).then(()=>{
                event.data.ref.remove((r) => {})
            });
        }
    });


function createBallot(payload){
    return new Promise((resolve, reject) => {
        console.log("BALLOT CREATE: ", JSON.stringify(payload));
        resolve("success");
    });
}