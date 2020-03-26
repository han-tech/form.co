const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

exports.handleForm = functions.https.onRequest((request, response) => {
    var form_id=request.query.form_id;
    var data = {
        username:request.body['username'],
        password:request.body['password']
    };

    var message = db.collection("data").add(data)
    .then(function(docRef) {
        db.collection("logs").add({
            form_id:form_id,
            data_id:docRef.id,
            log_created:Date.now(),
            state:'success'
        });
        console.log("Document written with ID: ", docRef.id);
        return 'Done';
    })
    .catch(function(error) {
        db.collection("logs").add({
            form_id:form_id,
            error:error,
            log_created:Date.now(),
            state:'fail'
        });
        console.error("Error adding document: ", error);
        return error;
    });
 response.send(message);
});
