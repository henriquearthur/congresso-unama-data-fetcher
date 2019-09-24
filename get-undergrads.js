/**
* Firebase dependencies and settings
*/

admin = require('firebase-admin');
serviceAccount = require('./congresso-unama-firebase-adminsdk-smxjg-5c420f3c7d.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

db = admin.firestore();

/**
 * Exceljs dependencies
 */
var Excel = require('exceljs');

/**
 * Other dependencies
 */
slugify = require('slugify');

/**
 * Remove '2019_graduandos' collection from Firestore
 */
function deleteCollection(db, collectionPath, batchSize) {
    let collectionRef = db.collection(collectionPath);
    let query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, batchSize, resolve, reject);
    });
}

function deleteQueryBatch(db, query, batchSize, resolve, reject) {
    query.get()
        .then((snapshot) => {
            // When there are no documents left, we are done
            if (snapshot.size == 0) {
                return 0;
            }

            // Delete documents in a batch
            let batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            return batch.commit().then(() => {
                return snapshot.size;
            });
        }).then((numDeleted) => {
            if (numDeleted === 0) {
                resolve();
                return;
            }

            // Recurse on the next process tick, to avoid
            // exploding the stack.
            process.nextTick(() => {
                deleteQueryBatch(db, query, batchSize, resolve, reject);
            });
        })
        .catch(reject);
}

console.log("Deleting '2019_graduandos' collection...");
//deleteCollection(db, '2019_graduandos', 100);

/**
 * Extract data from all .xlsx
 */
files = [
    'undergrads_direito.xlsx',
];

allPresentationData = [];

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

files.forEach(file => {
    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile(file)
        .then(function () {
            var worksheet = workbook.getWorksheet(1);
            worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
                // Extract data
                var names = row.values[1];
                var title = row.values[2];
                var congress = 'direito';
                //var type = row.values[5];
                //var presentationMethod = row.values[6];
                var location = row.values[3];
                var date = "27-09-2019";
                var hour = row.values[4];

                if (names != undefined && names != "RESUMOS APROVADOS" && names.trim() != "" && title.trim() != "") {
                    // Filter and organize data
                    names = names.split("  ");
                    names = names.filter(Boolean).map(string => string.trim());

                    congress = congress.toLowerCase();
                    //congress = congress.replace("engenharias", "engenharia");
                    //congress = congress.replace("informática", "computacao");

                    title = toTitleCase(title);
                    //type = toTitleCase(type);
                    //presentationMethod = toTitleCase(presentationMethod);

                    hour = hour.replace('h', ':').trim();

                    if (hour.length == 3) {
                        hour = hour + '00';
                    }

                    // Final presentation object
                    presentation = {
                        'congress': congress,
                        'names': names,
                        'title': title,
                        'location': location,
                        'date': date,
                        'hour': hour,
                    };

                    addToFirebase(presentation);
                }
            });
        });
});

/**
 * Add 'presentation' of specific 'congress' to Firestore
 * @param string congress
 * @param object presentation 
 */
function addToFirebase(presentation) {
    console.log("Added " + slugify(presentation.title, { lower: true }) + " to " + presentation.congress);

    db.collection('2019_graduandos').doc(presentation.congress + '-' + slugify(presentation.title, { lower: true })).set({
        'names': presentation.names,
        'title': presentation.title,
        //'type': presentation.type,
        //'presentation_method': presentation.presentationMethod,
        'location': presentation.location,
        'date': presentation.date,
        'hour': presentation.hour,
        //'hour_start': presentation.hourStart,
        //'hour_end': presentation.hourEnd,
        'congress': presentation.congress
    });
}