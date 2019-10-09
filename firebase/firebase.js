var admin = require('firebase-admin');
var serviceAccount = require('./congresso-unama-firebase-adminsdk-smxjg-5c420f3c7d.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "congresso-unama.appspot.com"
});

var db = admin.firestore();
var bucket = admin.storage().bucket();

exports.firestore = db;
exports.bucket = bucket;