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
 * 4º Congresso Nacional de Ciências Exatas e Tecnologias
 */

db.collection('2019_geral').doc('informacoes').set({
    location_address: 'R. Antônio Barreto, 1176',
    location_district: 'Umarizal - Belém - Pará',
    location_lat: -1.443250,
    location_lng: -48.477676,
    location_name: 'Belém Hall',
    date_start: '08-11-2019',
    date_end: '09-11-2019'
});

db.collection('2019_congressos').doc('artes_e_matematica').set({
    name: '1° Congresso Nacional de Artes Visuais e Matemática',
    short_name: 'Artes Visuais e Matemática',
    shortest_name: 'Artes e Matemática',
    description: 'Em breve',
    image: 'https://firebasestorage.googleapis.com/v0/b/congresso-unama.appspot.com/o/banner_artes_e_matematica.jpg?alt=media&token=e729c1db-8131-4eaf-89ee-9918f1104d45',
    color: '#008A59',
});

db.collection('2019_congressos').doc('arquitetura_e_design').set({
    name: '4° Congresso Nacional de Arquitetura e Urbanismo e Design de Interiores',
    short_name: 'Arquitetura e Urbanismo e Design de Interiores',
    shortest_name: 'Arquitetura e Design',
    description: 'Em breve',
    image: 'https://firebasestorage.googleapis.com/v0/b/congresso-unama.appspot.com/o/banner_arquitetura_e_design.jpg?alt=media&token=65b3a425-ec6f-4cf5-9352-a9834e84d2b8',
    color: '#CD723B',
});

db.collection('2019_congressos').doc('computacao_redes_e_analise').set({
    name: '4° Congresso Nacional de Ciência da Computação, Redes de Computadores e Análise e Desenvolvimento de Sistemas',
    short_name: 'Ciência da Computação, Redes de Computadores e Análise e Desenvolvimento de Sistemas',
    shortest_name: 'Informática',
    description: 'Em breve',
    image: 'https://firebasestorage.googleapis.com/v0/b/congresso-unama.appspot.com/o/banner_computacao_redes_e_analise.jpg?alt=media&token=f38c12f6-1824-4ea4-926d-c8b1e0531433',
    color: '#00695B',
});

db.collection('2019_congressos').doc('engenharias').set({
    name: '4° Congresso Nacional de Engenharia Civil, Ambiental e Sanitária, Produção, Elétrica e Mecânica',
    short_name: 'Engenharia Civil, Ambiental e Sanitária, Produção, Elétrica e Mecânica',
    shortest_name: 'Engenharias',
    description: 'Em breve',
    image: 'https://firebasestorage.googleapis.com/v0/b/congresso-unama.appspot.com/o/banner_engenharias.jpg?alt=media&token=fc5ce040-f149-41c7-a77c-fb82eca898ed',
    color: '#0C1780',
});
