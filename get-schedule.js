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
* Nightmare dependencies and settings
*/
Nightmare = require('nightmare');
nightmare = Nightmare({ show: true });

/**
 * Other dependencies
 */
https = require('https');
slugify = require('slugify');

var jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);

/**
 * Remove 'palestras' collection from Firestore
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

console.log("Deleting 'palestras' collection...");
deleteCollection(db, 'palestras', 100);

/**
* App
*/

var urls = [
    "https://eventos.sereduc.com/evento/217/3-congresso-nacional-de-arquitetura-e-urbanismo-belempa",
    "https://eventos.sereduc.com/evento/215/3-congresso-nacional-de-informatica-belempa",
    "https://eventos.sereduc.com/evento/216/3-congresso-nacional-de-engenharia-belempa"
];

var results = [];

urls.reduce(function (accumulator, url) {
    return accumulator.then(function () {
        return nightmare
            .on('console', (log, msg) => {
                console.log(msg);
            })
            .goto(url)
            .wait('#wt9_wtMainContent_wt2_SilkUIFramework_wt17_block_wtContent_wt65')
            .evaluate(url => {
                $("#wt9_wtMainContent_wt2_SilkUIFramework_wt17_block_wtContent_wt65").click();

                var resultsEvent = [];

                $("#wt9_wtMainContent_wt2_wt47_wtProgramacaoContainer .ProgramacaoItem").each(function (index, element) {
                    var currentDay = $(element);
                    var date = currentDay.data('date');

                    // console.log(date);

                    currentDay.find(".Item.OSInline").each(function (index, element) {
                        var item = $(element);

                        var period = item.find('div.Cinza').text().split('-');

                        var hourStart = period[0];
                        var hourEnd = period[1];
                        var type = item.find('span.Azul:nth-child(3)').text();
                        var title = item.find('span.Verde').text();
                        var speaker = item.find('.Wrapper.OSInline').text().replace("Conferencista:", "").replace("Conferencistas:", "");
                        var speaker_img = item.find('.ConferencistaImagem img').attr('src');
                        var speaker_details_url = item.find('.ConferencistaImagem').parent().attr('href');

                        // console.log("hourStart: " + hourStart);
                        // console.log("hourEnd: " + hourEnd);
                        // console.log("type: " + type);
                        // console.log("title: " + title);
                        // console.log("speaker: " + speaker);
                        // console.log("speaker_img: " + speaker_img);
                        // console.log("speaker_details_url: " + speaker_details_url);

                        // console.log('---------------------------------------');

                        var data = [url, date, hourStart, hourEnd, type, title, speaker, speaker_img, speaker_details_url];
                        resultsEvent.push(data);
                    });
                });

                return resultsEvent;
            }, url)
            .then(function (resultsEvent) {
                results.push(resultsEvent);
                return results;
            });
    });
}, Promise.resolve([])).then(function (results) {
    results.forEach(palestras => {
        palestras.forEach(palestra => {
            /**
             * Treat data from page
             */
            var url = palestra[0],
                date = palestra[1],
                hourStart = palestra[2].trim(),
                hourEnd = palestra[3].trim(),
                type = palestra[4].trim(),
                title = palestra[5].trim(),
                speaker = palestra[6].trim(),
                speaker_img = "https://eventos.sereduc.com" + palestra[7],
                speaker_details_url = "https://eventos.sereduc.com" + palestra[8];

            if (palestra[7] == null) {
                speaker_img = "";
            }

            if (type == "Credenciamento" || type == "Cerimônia de abertura") {
                var titleAux = title;

                title = type;
                type = titleAux;
            }

            var congresso;

            if (url == urls[0]) {
                congresso = "arquitetura";
            } else if (url == urls[1]) {
                congresso = "computacao";
            } else if (url == urls[2]) {
                congresso = "engenharia";
            }

            if (palestra[8] != null) {
                https.get(speaker_details_url, (resp) => {
                    let data = '';

                    // A chunk of data has been recieved.
                    resp.on('data', (chunk) => {
                        data += chunk;
                    });

                    // The whole response has been received. Print out the result.
                    resp.on('end', () => {
                        speaker_details = $(".Detalhes", data).text();

                        db.collection('palestras').doc(congresso + '-' + slugify(title, { lower: true })).set({
                            congress: congresso,
                            date: date,
                            hour_start: hourStart,
                            hour_end: hourEnd,
                            type: type,
                            title: title,
                            speaker: speaker,
                            speaker_img: speaker_img,
                            speaker_details: speaker_details || ""
                        });
                    });
                }).on("error", (err) => {
                    console.log("Error: " + err.message);
                });
            } else {
                db.collection('palestras').doc(congresso + '-' + slugify(title, { lower: true })).set({
                    congress: congresso,
                    date: date,
                    hour_start: hourStart,
                    hour_end: hourEnd,
                    type: type,
                    title: title,
                    speaker: speaker,
                    speaker_img: speaker_img,
                });
            }
        });
    });
});
