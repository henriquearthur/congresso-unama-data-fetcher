const firestoreService = require('firestore-export-import');
const serviceAccount = require('./firebase/congresso-unama-firebase-adminsdk-smxjg-5c420f3c7d.json');
const databaseURL = 'https://congresso-unama.firebaseio.com';

firestoreService.initializeApp(serviceAccount, databaseURL);

firestoreService
    .backups(['2019_v1.1_congressos', '2019_v1.1_palestras'])
    .then(data => {
        var json = JSON.stringify(data);

        const fs = require('fs');

        var filename = "backup_" + new Date() + ".json";

        fs.writeFile("backups/" + filename, json, function (err) {
            if (err) {
                return console.log(err);
            }

            console.log("Backup saved!");
        });
    });