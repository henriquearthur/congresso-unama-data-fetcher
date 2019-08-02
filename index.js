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

/**
* App
*/

for (let index = 0; index < 5; index++) {
    console.log("WARNING!! Don't forget to exclude previous data on Cloud Firestore manually.");
}

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
                speaker_img = "https://eventos.sereduc.com" + palestra[7];

            if (palestra[7] == null) {
                speaker_img = "";
            }

            if (type == "Credenciamento" || type == "Cerimônia de abertura") {
                var titleAux = title;

                title = type;
                type = titleAux;
            }

            /**
             * Add to Firebase
             */
            var congresso;

            if (url == urls[0]) {
                congresso = "arquitetura";
            } else if (url == urls[1]) {
                congresso = "computacao";
            } else if (url == urls[2]) {
                congresso = "engenharia";
            }

            setDoc = db.collection('palestras').doc(congresso + '-' + slugify(title, { lower: true })).set({
                event: congresso,
                date: date,
                hour_start: hourStart,
                hour_end: hourEnd,
                type: type,
                title: title,
                speaker: speaker,
                speaker_img: speaker_img
            });
        });
    });
});
