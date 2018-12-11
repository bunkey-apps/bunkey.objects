import Nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = Nodemailer.createTransport({
      host: process.env.HOST_MAIL,
      port: process.env.PORT_MAIL,
      secure: false,
      auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.PASSWORD_USER,
      },
    });
  }
  sendSharedObject(shared, emiter, receiver, object) {
    const { webToken } = shared;
    const mailOptions = {
      from: process.env.FROM_MAIL,
      to: receiver.email,
      subject: 'Invitación a Bunkey',
      html: `<p>Hola ${receiver.name || receiver.email}, nuestro usuario ${emiter.name} ha conpartido contigo el archivo ${object.name}.</p>
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
