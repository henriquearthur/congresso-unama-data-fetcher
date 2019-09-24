/**
 * CUSTOM SETTINGS
 */

var urls = [
    "https://eventos.sereduc.com/evento/305/i-congresso-brasileiro-de-direito-e-constituicao-belempa",

    "https://eventos.sereduc.com/evento/305/i-congresso-brasileiro-de-direito-e-constituicao-belempa",
];

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

console.log("Deleting '2019_palestras' collection...");
deleteCollection(db, '2019_palestras', 100);

/**
* App
*/

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

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
            })
            .catch(function (error) {
                console.error('Nightmare failed:', error);
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
                speaker_details_url = "https://eventos.sereduc.com" + palestra[8],
                local = '';

            if (palestra[7] == null) {
                speaker_img = "";
            }

            if (type == "Credenciamento" || type == "Cerimônia de abertura") {
                var titleAux = title;

                title = type;
                type = titleAux;
            }

            if (title.toUpperCase().includes('AUDITÓRIO')) {
                titleArr = title.split(' - ');
                local = titleArr[0];
                title = title.replace(local + ' - ', '');

                if (title.toUpperCase().includes('AUDITÓRIO')) {
                    titleArr = title.split(' – ');
                    local = titleArr[0];
                    title = title.replace(local + ' – ', '');

                    if (title.toUpperCase().includes('AUDITÓRIO')) {
                        titleArr = title.split(' : ');
                        local = titleArr[0];
                        title = title.replace(local + ' : ', '');
                    }
                }
            }

            local = local.replace('01', '1');
            local = local.replace('02', '2');
            local = local.replace('03', '3');

            if (speaker.includes('-')) {
                speakerArr = speaker.split('-');
                speaker = speakerArr[0].trim();
            }

            if (speaker.includes('–')) {
                speakerArr = speaker.split('–');
                speaker = speakerArr[0].trim();
            }

            if (speaker === speaker.toUpperCase()) {
                speaker = toTitleCase(speaker);
            }

            local = toTitleCase(local);

            var congresso;
            if (url == urls[1]) { congresso = 'direito'; }

            // if (url == urls[1]) { congresso = 'artes_e_matematica'; }
            // if (url == urls[2]) { congresso = 'arquitetura_e_design'; }
            // if (url == urls[3]) { congresso = 'computacao_redes_e_analise'; }
            // if (url == urls[4]) { congresso = 'engenharias'; }

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

                        db.collection('2019_palestras').doc(congresso + '-' + slugify(title + '-' + speaker, { lower: true })).set({
                            congress: congresso,
                            date: date,
                            hour_start: hourStart,
                            hour_end: hourEnd,
                            type: type,
                            title: title,
                            local: local,
                            speaker: speaker,
                            speaker_img: speaker_img,
                            speaker_details: speaker_details || ""
                        });
                    });
                }).on("error", (err) => {
                    console.log("Error: " + err.message);
                });
            } else {
                db.collection('2019_palestras').doc(congresso + '-' + slugify(title, { lower: true })).set({
                    congress: congresso,
                    date: date,
                    hour_start: hourStart,
                    hour_end: hourEnd,
                    type: type,
                    title: title,
                    local: local,
                    speaker: speaker,
                    speaker_img: speaker_img,
                });
            }
        });
    });
});
