import Nodemailer from 'nodemailer';

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

  sendSharedPrivateObject(emiter, receiver, object) {
    const mailOptions = {
      from: process.env.FROM_MAIL,
      to: receiver.email,
      subject: 'Archivo Compartido en Bunkey',
      html: `<p>Hola <b>${receiver.name}</b>, nuestro usuario <b>${emiter.name}</b> ha conpartido contigo el archivo <b>${object.name}</b>.</p>
      <p>Has click <a href="${process.env.BUNKEY_HOME_URL}">aquí</a> para aceptar.</p>`,
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

  sendSharedObject(shared, emiter, receiver, object) {
    const { webToken } = shared;
    const mailOptions = {
      from: process.env.FROM_MAIL,
      to: receiver,
      subject: 'Archivo Compartido en Bunkey',
      html: `<p>Hola <b>${receiver}</b>, nuestro usuario <b>${emiter.name}</b> ha conpartido contigo el archivo <b>${object.name}</b>.</p>
      <p>Has click <a href="${TokenService.generateWebURL('shared', webToken)}">aquí</a> para aceptar.</p>`,
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

export default EmailService;
