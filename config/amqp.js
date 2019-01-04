const Cube = require('cano-cube');
const amqp = require('amqplib');

class AMQPCube extends Cube {
  async up() {
    const { CLOUDAMQP_URI } = process.env;
    if (!CLOUDAMQP_URI) throw new Error('Variable CLOUDAMQP URI unspecified');
    const conn = await amqp.connect(CLOUDAMQP_URI);
    process.once('SIGINT', () => conn.close());
    const ch = await conn.createChannel();
    await ch.assertQueue('bunkey_tagging_queue', { durable: true });
    ch.consume('bunkey_tagging_queue', async (msg) => {
      await TagService.process(msg);
    }, { noAck: true });
    cano.log.info('AMQPCube -> up: Waiting for messages.');
  }
}

module.exports = AMQPCube;
