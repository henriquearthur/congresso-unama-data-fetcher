/** Imports */
const database = require('./database/database');
const helpers = require('./helpers/helpers');
const path = require('path');
const Nightmare = require('nightmare');
nightmare = Nightmare({ show: true });
const slugify = require('slugify');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;
const $ = require('jquery')(window);

/** Global config */
const url = 'https://eventos.sereduc.com';

/** App */
function app() {
    console.log('Executando app...');

    return nightmare

        .goto(url)
        // Wait for div which contains all events
        .wait('#wt10_wtMainContent_wt8_wtConteudoContainer')
        .evaluate(() => {
            console.log('Iterando eventos...');

            var eventsUrl = [];

            $(".ItemEvento").each(function (index, element) {
                var titulo = $(element).find('span.Titulo').text().trim();

                if (titulo.toLowerCase().includes('belém/pa')) {
                    console.log('Evento encontrado: ' + titulo);

                    var eventUrl = $(element).find('a:first-child').attr('href');
                    eventsUrl.push(eventUrl);
                }
            });

            return eventsUrl;
        })
        .then((eventsUrl) => {
            eventsUrl = eventsUrl.map((value) => 'https://eventos.sereduc.com/' + value);
            console.log('eventsUrl:', eventsUrl);

            eventsUrl.reduce(function (accumulator, eventUrl) {
                return accumulator.then(function (result) {
                    console.log('Executando evento (' + eventUrl + ')...');

                    return nightmare
                        .on('console', function (log, msg) {
                            return console.log(msg);
                        })
                        .goto(eventUrl)
                        .wait('#wt9_wtMainContent_wt2_SilkUIFramework_wt17_block_wtContent_wt65')
                        .evaluate((eventUrl) => {
                            console.log('Obtendo dados do evento (' + eventUrl + ')...');

                            var eventTitle = $(document).attr('title').split('| Eventos')[0].trim();
                            var eventDescription = $("#wt9_wtMainContent_wt2_wtTabContentsContainerDescricao .TabContent.ContainerTexto[data-tab='sobre']").text();
                            result = [];

                            // Para cada dia na aba Programação
                            $("#wt9_wtMainContent_wt2_wt47_wtProgramacaoContainer .ProgramacaoItem").each(function (index, element) {
                                var $el = $(element);
                                var date = $el.data('date');

                                // Para cada palestra deste dia
                                $el.find('.Item.OSInline').each(function (index, elementLecture) {
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
                                    var speakerImg = $lecture.find('.ConferencistaImagem img').attr('src');

                                    // Get speaker details
                                    var speakerDetailsUrl = $lecture.find('.ConferencistaImagem').parent().attr('href');

                                    result.push({
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

                            result.push({
                                'title': eventTitle.toString(),
                                'description': eventDescription,
                                'lectures': result,
                            });

                            return result;
                        }, eventUrl)
                        .end()
                        .then(result => {
                            return result;
                        });
                });
            }, Promise.resolve([])).then(function (result) {
                console.log("Promise resolved");
                console.log(result);

                // if (speakerDetailsUrl != null) {
                //     console.log('Obtendo informações de palestrante (' + speakerDetailsUrl + ')');
                //     speakerDetailsUrl = 'https://eventos.sereduc.com' + speakerDetailsUrl;

                //     var https = require('https');

                //     https.get(speaker_details_url, (resp) => {
                //         let data = '';

                //         // A chunk of data has been recieved.
                //         resp.on('data', (chunk) => {
                //             data += chunk;
                //         });

                //         // The whole response has been received. Print out the result.
                //         resp.on('end', () => {
                //             speakerDetails = $(".Detalhes", data).text();
                //         });
                //     }).on("error", (err) => {
                //         console.log('https error: ' + err.message);
                //     });
                // }

                // if (data != null && data != undefined && data.title != undefined) {
                //     console.log('Adicionando dados do evento (' + eventUrl + ') no Firestore...');
                //     print(data);

                //     var congressId = slugify(data.title, { lower: true });

                //     // Informações gerais do evento
                //     database.firestore.collection('2019_v1.1_congressos')
                //         .doc(congressId).set({
                //             'title': data.title,
                //             'description': data.description
                //         });

                //     // Palestras do evento
                //     data.lectures.forEach(lecture => {
                //         var lectureId = slugify(congressId + '_' + lecture.title, { lower: true });

                //         lecture.congress = congressId;

                //         database.firestore.collection('2019_v1.1_palestras')
                //             .doc(lectureId).set(lecture).finally(() => {
                //                 console.log('' + lectureId + ' adicionado no Firestore.');
                //             });
                //     });
                // }
            });
        })
        .catch((error) => {
            console.error('ERRO - Nightmare: ', error);
            console.info('Executando novamente...');

            app();
        });
}

app();
