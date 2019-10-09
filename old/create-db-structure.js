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
 * Create DB structure for
 * 
 * I Congresso Brasileiro de Direito e Constituição
 */

db.collection('2019_geral').doc('informacoes').set({
    event_name: 'I Congresso Brasileiro de Direito e Constituição',
    location_address: 'Av. Doutor Freitas, s/n',
    location_district: 'Marco - Belém - Pará',
    location_lat: -1.421702,
    location_lng: -48.456776,
    location_name: 'Hangar Convenções & Feiras da Amazônia',
    date_start: '26-09-2019',
    date_end: '28-09-2019',
    date_undergrads: '27-09-2019',
});

db.collection('2019_congressos').doc('direito').set({
    name: 'I Congresso Brasileiro de Direito e Constituição',
    short_name: 'Direito e Constituição',
    shortest_name: 'Direito e Constituição',
    description: 'A UNAMA (Universidade da Amazônia), por intermédio do Instituto de Ciências Jurídicas e do Mestrado em Direitos Fundamentais, em parceria com a Faculdade Maurício de Nassau – UNINASSAU/Belém, promoverá de 26 a 28 de setembro, no Hangar Centro de Convenções e Feiras da Amazônia o I Congresso Brasileiro de Direito e Constituição, que tem como tema principal: "Direitos Fundamentais e novos direitos".\n\nProfissionais que são referências em diversas áreas do Direito comporão o quadro de palestrantes do evento.O jurista paraense Orlando Bitar é o homenageado do congresso, no ano em que se comemora seu centenário de nascimento.Orlando Chicre Miguel Bitar ocupou os mais relevantes cargos jurídicos do Estado do Pará, sendo considerado o maior constitucionalista paraense de todos os tempos.',
    image: 'https://firebasestorage.googleapis.com/v0/b/congresso-unama.appspot.com/o/banner_direito.jpg?alt=media&token=7d3b2a0d-ce5b-4ccc-9b58-7231c0c82191',
    color: '#014F25',
    link: 'https://eventos.sereduc.com/evento/305/i-congresso-brasileiro-de-direito-e-constituicao-belempa',
});
