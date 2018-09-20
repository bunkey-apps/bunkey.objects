import supertest from 'supertest';
import app from '../../server.js';
import clientData from '../fixtures/Client';

let apikey = '';
let server = {};
let request = {};
let client = {};

describe('Client Controller tests', () => {

  it('Should create a new client', async () => {
    const { body } = await request
      .post('/clients')
      .set('apikey', apikey)
      .send(clientData)
      .expect(201);
    client = body;
    // cano.log.debug('client', client);
  });

  it('Should get object root of client by id', async () => {
    await request
      .get(`/clients/${client._id}/objects/${client.root}`)
      .set('apikey', apikey)
      .expect(200);
  });

  it('Should update client by id', async () => {
    await request
      .put(`/clients/${client._id}`)
      .set('apikey', apikey)
      .send({ name: "Night's Watch 2" })
      .expect(204);
  });

  it('Should delete client by id', async () => {
    await request
      .delete(`/clients/${client._id}`)
      .set('apikey', apikey)
      .expect(204);
  });

  before(async () => {
    try {
      server = await app;
      request = supertest(server);
      apikey = process.env.API_GATEWAY_APIKEY;
    } catch (e) {
      cano.log.error(e);
    }
  });

});
