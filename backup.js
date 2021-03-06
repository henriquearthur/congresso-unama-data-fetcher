require('dotenv').config();

const firestoreService = require('firestore-export-import');
const serviceAccount = require('./firebase/congresso-unama-firebase-adminsdk-smxjg-5c420f3c7d.json');
const databaseURL = 'https://congresso-unama.firebaseio.com';

firestoreService.initializeApp(serviceAccount, databaseURL);

firestoreService
    .backups(['2019_v1.1_congressos', '2019_v1.1_palestras'])
    .then(data => {
        var json = JSON.stringify(data);

        const fs = require('fs');

        var filename = "backup_" + new Date() + ".json";

        fs.writeFile("backups/" + filename, json, function (err) {
            if (err) {
                return console.log(err);
            }

            console.log("Backup saved!");

            // Send .json file to e-mail
            const nodemailer = require('nodemailer');

            const config = {
                mailserver: {
                    host: 'smtp.zoho.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'eu@henriquearthur.com.br',
                        pass: process.env.EMAIL_PASS
                    }
                },
                mail: {
                    from: 'eu@henriquearthur.com.br',
                    to: ['eu@henriquearthur.com.br', 'hnrq.art@gmail.com'],
                    subject: '[Congressos Unama Data Fetcher] Backup realizado',
                    text: 'Arquivo .json em anexo.',
                    attachments: [
                        {
                            filename: filename,
                            content: fs.createReadStream('backups/' + filename)
                        },
                    ]
                },
            };

            const sendMail = async ({ mailserver, mail }) => {
                let transporter = nodemailer.createTransport(mailserver);
                let info = await transporter.sendMail(mail);
            };

            sendMail(config).catch(console.error);
        });
    });