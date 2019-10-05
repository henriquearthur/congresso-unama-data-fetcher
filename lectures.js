/**
 * Imports
 */
const https = require('https');
const jsdom = require("jsdom");

const database = require('./database/database');
const slugify = require('slugify');

/**
 * App functions
 */
function getEventsUrl() {
    console.log("Obtendo URLs dos eventos...");
    https.get('https://eventos.sereduc.com', (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            var { JSDOM } = jsdom;
            var dom = new JSDOM(data);
            var $ = (require('jquery'))(dom.window);

            var eventsUrl = [];

            $(".ItemEvento").each(function (index, element) {
                var titulo = $(element).find('span.Titulo').text().trim();

                if (titulo.toLowerCase().includes('belém/pa')) {
                    console.log('Evento encontrado: ' + titulo);

                    var eventUrl = $(element).find('a:first-child').attr('href');
                    eventsUrl.push(eventUrl);
                }
            });

            eventsUrl = eventsUrl.map((value) => 'https://eventos.sereduc.com/' + value);
            console.log('eventsUrl:', eventsUrl);

            eventsUrl.forEach(url => getEventData(url));
        });

    }).on("error", (err) => {
        console.log("[https] Error: " + err.message);
    });
}

function getEventData(url) {
    console.log("Obtendo dados do evento (" + url + ")");

    https.get(url, (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            var { JSDOM } = jsdom;
            var dom = new JSDOM(data);
            var $ = (require('jquery'))(dom.window);

            console.log("Extraindo dados do evento obtido (" + url + ")");

            var eventTitle = dom.window.document.title.split('| Eventos')[0].trim();
            var eventDescription = $("#wt9_wtMainContent_wt2_wtTabContentsContainerDescricao .TabContent.ContainerTexto[data-tab='sobre']").text();
            var eventImg = $("#wt9_wtMainContent .ViewEvento > .Img img").attr('src');

            var lectures = [];

            // Para cada dia na aba Programação
            $("#wt9_wtMainContent_wt2_wt47_wtProgramacaoContainer .ProgramacaoItem").each(function (index, element) {
                var $el = $(element);
                var date = $el.data('date');

                // Para cada palestra deste dia
                $el.find('.Item.OSInline').each(async function (index, elementLecture) {
                    var $lecture = $(elementLecture);

                    // Hour
                    var hour = $lecture.find('div.Cinza').text().split('-');
                    var hourStart = hour[0];
                    var hourEnd = hour[1];

                    // Lecture information
                    var type = $lecture.find('span.Azul:nth-child(3)').text();
                    var title = $lecture.find('span.Verde').text();
                    var description = $lecture.find('.Wrapper.OSInline').text();

                    // Speaker information
                    var speakerName = $lecture.find('.ConferencistaImagem .Nome').text();
                    var speakerImg = 'https://eventos.sereduc.com' + $lecture.find('.ConferencistaImagem img').attr('src') || '';

                    // Get speaker details
                    var speakerDetailsUrl = $lecture.find('.ConferencistaImagem').parent().attr('href');

                    lectures.push({
                        'date': date,
                        'hour_start': hourStart,
                        'hour_end': hourEnd,
                        'type': type,
                        'title': title,
                        'description': description,
                        'speaker_name': speakerName,
                        'speaker_img': speakerImg,
                        'speaker_details_url': speakerDetailsUrl,
                    });
                });
            });

            processEventData({
                'title': eventTitle,
                'description': eventDescription,
                'image': eventImg,
                'lectures': lectures
            });
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
}

async function processEventData(data) {
    console.log("Processando dados do evento: " + data.title);

    // Informações gerais do evento
    var congressId = slugify(data.title, { lower: true });
    console.log("Inserindo informações gerais do evento no Firestore (" + congressId + ")");

    database.firestore.collection('2019_v1.1_congressos')
        .doc(congressId)
        .set({
            'title': data.title,
            'description': data.description,
            'image': data.image,
        });

    for (var lecture of data.lectures) {
        // Obter informações adicionais do palestrante se houver dados suficientes
        if (lecture.speaker_details_url != undefined &&
            lecture.speaker_details_url != '' &&
            lecture.speaker_details_url != '/Popup_EventoConferencista.aspx?ConferencistaId=0') {
            var url = 'https://eventos.sereduc.com' + lecture.speaker_details_url;
            lecture.speaker_details = await getSpeakerDetails(url);
        }

        // Processando o objeto lecture
        var lectureId = slugify(congressId + '_' + lecture.title, { lower: true });

        lecture.congress = congressId;
        delete lecture.speaker_details_url;

        // Inserindo dados no Firestore
        console.log("Inserindo palestra " + lectureId + " no congresso " + congressId)

        database.firestore.collection('2019_v1.1_palestras')
            .doc(lectureId)
            .set(lecture)
            .finally(() => console.log('Adicionado no Firestore: ' + lectureId));
    }
}

function getSpeakerDetails(url) {
    console.log('Obtendo informações de palestrante (' + url + ')');

    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                var { JSDOM } = jsdom;
                var dom = new JSDOM(data);
                var $ = (require('jquery'))(dom.window);

                speakerDetails = $(".Detalhes", data).text();

                resolve(speakerDetails);
            });

        }).on("error", (err) => {
            reject(err);
        });
    });
}

/** Start app */
getEventsUrl();