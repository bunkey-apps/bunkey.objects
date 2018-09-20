import Cano from 'cano-koa';
import dotenv from 'dotenv';

dotenv.config();
const app = new Cano(__dirname);

module.exports = app.up();
