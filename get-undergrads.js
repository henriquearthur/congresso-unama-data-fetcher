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
 * Remove 'graduandos' collection from Firestore
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

console.log("Deleting 'graduandos' collection...");
deleteCollection(db, 'graduandos', 100);

/**
 * Extract data from all .xlsx
 */
files = [
    'undergrads_arquitetura.xlsx',
    'undergrads_computacao.xlsx',
    'undergrads_engenharia.xlsx',
];

allPresentationData = [];

files.forEach(file => {
    var workbook = new Excel.Workbook();
    workbook.xlsx.readFile(file)
        .then(function () {
            var worksheet = workbook.getWorksheet(1);
            worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
                // Extract data
                var names = row.values[1];
                var title = row.values[3];
                var type = row.values[5];
                var presentationMethod = row.values[6];
                var location = row.values[7];
                var date = "26-10-2018";
                var hour = row.values[9];

                if (names != undefined && names != "AUTOR PRINCIPAL") {
                    // Filter and organize data
                    names = names.split("  ");
                    names = names.filter(Boolean).map(string => string.trim());

                    hour = hour.split("-");
                    hourStart = hour[0];
                    hourEnd = hour[1];

                    congress = file.replace('undergrads_', '');
                    congress = congress.replace('.xlsx', '');

                    // Final presentation object
                    presentation = {
                        'names': names,
                        'title': title,
                        'type': type,
                        'presentationMethod': presentationMethod,
                        'location': location,
                        'date': date,
                        'hourStart': hourStart,
                        'hourEnd': hourEnd
                    };

                    addToFirebase(congress, presentation);
                }
            });
        });
});

/**
 * Add 'presentation' of specific 'congress' to Firestore
 * @param string congress
 * @param object presentation 
 */
function addToFirebase(congress, presentation) {
    console.log("Added " + slugify(presentation.title, { lower: true }) + " to " + congress);

    db.collection('graduandos').doc(congress + '-' + slugify(presentation.title, { lower: true })).set({
        'names': presentation.names,
        'title': presentation.title,
        'type': presentation.type,
        'presentationMethod': presentation.presentationMethod,
        'location': presentation.location,
        'date': presentation.date,
        'hourStart': presentation.hourStart,
        'hourEnd': presentation.hourEnd
    });
}