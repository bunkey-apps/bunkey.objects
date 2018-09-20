import supertest from 'supertest';
import app from '../../server.js';
import clientData from '../fixtures/Client';
import objectData from '../fixtures/Object';
const [
  f1,
  f2,
  f3,
  i1,
  v1,
  v2,
] = objectData;

let folder;
let image;
let video;
let apikey = '';
let server = {};
let request = {};
let client = {};

describe('Object Controller tests', () => {

  it('Should create a new client', async () => {
    const { body } = await request
      .post('/clients')
      .set('apikey', apikey)
      .send(clientData)
      .expect(201);
    client = body;
  });

  it('Should get object root of client by id', async () => {
    await request
      .get(`/clients/${client._id}/objects/${client.root}`)
      .set('apikey', apikey)
      .expect(200);
  });

  it('Should create folder on root of client by id', async () => {
    const { body } = await request
      .post(`/clients/${client._id}/objects/${client.root}`)
      .set('apikey', apikey)
      .send(f1)
      .expect(201);
      folder = body;
      // cano.log.debug('folder', folder);
  });

  it('Should create file [image] on root of client by id', async () => {
    const { body } = await request
      .post(`/clients/${client._id}/objects/${client.root}`)
      .set('apikey', apikey)
      .send(i1)
      .expect(201);
    image = body;
    // cano.log.debug('image', image);
  });

  it('Should create file [video] on folder of client by id', async () => {
    const { body } = await request
      .post(`/clients/${client._id}/objects/${folder._id}`)
      .set('apikey', apikey)
      .send(v1)
      .expect(201);
    video = body;
    // cano.log.debug('video', video);
  });

  it('Should update file [video] on folder of client by id', async () => {
    await request
      .put(`/clients/${client._id}/objects/${video._id}`)
      .set('apikey', apikey)
      .send({ name: 'File 2' })
      .expect(204);
  });

  it('Should delete file [image] on root of client by id', async () => {
    await request
      .delete(`/clients/${client._id}/objects/${image._id}`)
      .set('apikey', apikey)
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
