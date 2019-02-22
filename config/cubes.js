import ControllersCube from 'cano-cube-controllers';
import ServicesCube from 'cano-cube-services';
import PoliciesCube from 'cano-cube-policies';
import RoutersCube from 'cano-cube-routers';
import MongooseCube from 'cano-cube-mongoose';
import PassportCube from 'cano-cube-passport';
import ErrorCube from 'cano-cube-error';
import AMQPCube from './amqp';

module.exports = [
  ErrorCube,
  PassportCube,
  MongooseCube,
  ServicesCube,
  ControllersCube,
  PoliciesCube,
  RoutersCube,
  AMQPCube,
];
