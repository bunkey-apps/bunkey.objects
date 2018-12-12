import MongooseModel from 'mongoose-model-class';
import includes from 'lodash/includes';
import map from 'lodash/map';

const invalidTypes = ['root', 'foder', 'workspace'];

class SharedController {
    async create(ctx) {
        const { body } = ctx.request;
        const {
            object,
            user,
            email,
        } = body;
        // Primero obtenemos el emisor
        let response = await UserService.getById(user);
        const emitter = response.body;
        // Segundo obtenemos el objeto
        const sharedObject = await ObjectModel.getById(object);
        if (includes(invalidTypes, sharedObject.type)) {
            throw new ObjectError('SharedObjectTypeInvalid', 'Shared object type invalid.');
        }
        // Tercero buscamos al receptor
        response = await UserService.getByEmail(email);
        let isPublic = true;
        let receiver = email;
        let receiverUser = null;
        if (response.body.length === 1) {
            [receiverUser] = response.body;
            // Verificamos si el usuario existente forma parte del workspace del cliente dueño del objeto
            const ws = await Workspace.findOne({ client: sharedObject.client, user: receiverUser._id });
            if (ws) {                
                isPublic = false;
                receiver = receiverUser._id;
            }
        }
        // Cuarto buscamos si fue previamente compartido
        const criteria = {};
        if (MongooseModel.adapter.Types.ObjectId.isValid(receiver)) {
            Object.assign(criteria, { $and: [{ object }, { $or: [{ receiverUser: receiver }, { receiverUser: email }] }] });
        } else {
            Object.assign(criteria, { $and: [{ object }, { receiverUser: receiver }] });
        }
        let shared = await Shared.findOne(criteria);
        if (!shared) {
            // Si no exite un previo, se crea
            shared = await Shared.create({
                client: sharedObject.client,
                emitterUser: user,
                isPublic,
                object,
                receiverUser: receiver,
            });
        }
        // Finalmente se envia el correo para avisar al usuario receptor
        if (isPublic) {
            await EmailService.sendSharedObject(shared, emitter, receiver, sharedObject);
        } else {
            console.log('receiverUser', receiverUser);
            await EmailService.sendSharedPrivateObject(emitter, receiverUser, sharedObject);            
        }
        ctx.status = 204;
    }

    async validate(ctx) {
        const { body: { webToken } } = ctx.request;
        const shared = await Shared.validate(webToken);
        const {
            accessToken, 
            client,
            emitterUser,
            object,
            receiverUser,
        } = shared;
        const response = await UserService.getById(emitterUser);
        const { _id, name } = response.body;
        ctx.body = {
            accessToken,
            client,
            emitterUser: { _id, name },
            object,
            receiverUser,
        };
        ctx.status = 200;
    }

    async get({ query, params: { client, user }, response }) {
        const { body: receiverUser } = await UserService.getById(user);
        const criteria = {
            ...query,
            client,
            receiverUser: [user, receiverUser.email],
            status: true,
        };
        const { collection, pagination } = await Shared.get(criteria);
        response.set('X-Pagination-Total-Count', pagination['X-Pagination-Total-Count']);
        response.set('X-Pagination-Limit', pagination['X-Pagination-Limit']);
        response.status = 200;
        response.body = collection;
    }
}

module.exports = SharedController;
