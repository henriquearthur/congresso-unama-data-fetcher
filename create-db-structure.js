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

var col = db.collection('4_congresso_nacional_ciencias_exatas_e_tecnologia');

col.doc('localizacao').set({
    address: 'R. Antônio Barreto, 1176',
    district: 'Umarizal - Belém - Pará',
    lat: -1.443250,
    lng: -48.477676,
    name: 'Belém Hall',
    date_start: '08-11-2019',
    date_end: '09-11-2019'
});

col.doc('periodo').set({
    date_start: '08-11-2019',
    date_end: '09-11-2019'
});

col.doc('congresso_artes_e_matematica').set({
    name: '1° Congresso Nacional de Artes Visuais e Matemática',
    short_name: 'Artes Visuais e Matemática',
    shortest_name: 'Artes Visuais e Matemática',
    description: 'Em breve',
    image: 'https://firebasestorage.googleapis.com/v0/b/congresso-unama.appspot.com/o/banner_artes_e_matematica.jpg?alt=media&token=e729c1db-8131-4eaf-89ee-9918f1104d45',
});

col.doc('congresso_arquitetura_e_design').set({
    name: '4° Congresso Nacional de Arquitetura e Urbanismo e Design de Interiores',
    short_name: 'Arquitetura e Urbanismo e Design de Interiores',
    shortest_name: 'Arquitetura e Urbanismo e Design de Interiores',
    description: 'Em breve',
    image: 'https://firebasestorage.googleapis.com/v0/b/congresso-unama.appspot.com/o/banner_arquitetura_e_design.jpg?alt=media&token=65b3a425-ec6f-4cf5-9352-a9834e84d2b8',
});

col.doc('congresso_computacao_redes_e_analise').set({
    name: '4° Congresso Nacional de Ciência da Computação, Redes de Computadores e Análise e Desenvolvimento de Sistemas',
    short_name: 'Ciência da Computação, Redes de Computadores e Análise e Desenvolvimento de Sistemas',
    shortest_name: 'Computação, Redes e Análise',
    description: 'Em breve',
    image: 'https://firebasestorage.googleapis.com/v0/b/congresso-unama.appspot.com/o/banner_computacao_redes_e_analise.jpg?alt=media&token=f38c12f6-1824-4ea4-926d-c8b1e0531433',
});

col.doc('congresso_engenharias').set({
    name: '4° Congresso Nacional de Engenharia Civil, Ambiental e Sanitária, Produção, Elétrica e Mecânica',
    short_name: 'Engenharia Civil, Ambiental e Sanitária, Produção, Elétrica e Mecânica',
    shortest_name: 'Engenharias',
    description: 'Em breve',
    image: 'https://firebasestorage.googleapis.com/v0/b/congresso-unama.appspot.com/o/banner_engenharias.jpg?alt=media&token=fc5ce040-f149-41c7-a77c-fb82eca898ed',
});

// Palestras da trilha principal (get-schedule.js)
col.doc('congresso_artes_e_matematica').collection('palestras_trilha_principal');
col.doc('congresso_arquitetura_e_design').collection('palestras_trilha_principal');
col.doc('congresso_computacao_redes_e_analise').collection('palestras_trilha_principal');
col.doc('congresso_engenharias').collection('palestras_trilha_principal');

// Trabalhos de congressistas (get-undergrads.js)
col.doc('congresso_artes_e_matematica').collection('trabalhos_congressistas');
col.doc('congresso_arquitetura_e_design').collection('trabalhos_congressistas');
col.doc('congresso_computacao_redes_e_analise').collection('trabalhos_congressistas');
col.doc('congresso_engenharias').collection('trabalhos_congressistas');