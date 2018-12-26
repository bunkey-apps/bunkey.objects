/* eslint-disable max-len */
/* eslint-disable no-use-before-define */
import Nodemailer from 'nodemailer';
import replace from 'lodash/replace';
import fs from 'fs';
import path from 'path';

class EmailService {
  constructor() {
    this.transporter = Nodemailer.createTransport({
      // host: process.env.HOST_MAIL,
      // port: process.env.PORT_MAIL,
      // secure: false,
      service: 'gmail',
      auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.PASSWORD_USER,
      },
    });
  }

  async sendSharedPrivateObject(emiter, receiver, object) {
    const message = `<p>Hola <b>${receiver.name}</b>, nuestro usuario <b>${emiter.name}</b> ha compartido contigo el archivo <b>${object.name}</b>.</p>
    <p>Has click <a href="${process.env.BUNKEY_HOME_URL}">aquí</a> para aceptar.</p>`;
    const template = await getTemplate();
    const html = replace(template, '{{message}}', message);
    const mailOptions = {
      from: process.env.FROM_MAIL,
      to: receiver.email,
      subject: 'Archivo Compartido en Bunkey',
      html,
    };
    return new Promise((resolve, reject) => {
      this.transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          cano.log.error(error);
          reject(error);
          return;
        }
        resolve(info);
      });
    });
  }

  async sendSharedObject(shared, emiter, receiver, object) {
    const { webToken } = shared;
    const message = `<p>Hola <b>${receiver}</b>, nuestro usuario <b>${emiter.name}</b> ha compartido contigo el archivo <b>${object.name}</b>.</p>
    <p>Has click <a href="${TokenService.generateWebURL('shared', webToken)}">aquí</a> para aceptar.</p>`;
    const template = await getTemplate();
    const html = replace(template, '{{message}}', message);
    const mailOptions = {
      from: process.env.FROM_MAIL,
      to: receiver,
      subject: 'Archivo Compartido en Bunkey',
      html,
    };
    return new Promise((resolve, reject) => {
      this.transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          cano.log.error(error);
          reject(error);
          return;
        }
        resolve(info);
      });
    });
  }
}

function getTemplate() {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, '../assets/template-email.html'), 'utf8', (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}

export default EmailService;
