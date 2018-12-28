import MongooseModel from 'mongoose-model-class';
import moment from 'moment';
import includes from 'lodash/includes';
import { resolve, reject } from 'any-promise';

const invalidTypes = ['root', 'workspace'];

class SharedController {
    async create(ctx) {
        const { body } = ctx.request;
        const {
            object,
            user,
            email,
        } = body;
        // Primero obtenemos el emisor
        const emitter = await User.getById(user);
        // Segundo obtenemos el objeto
        const sharedObject = await ObjectModel.getById(object);
        if (includes(invalidTypes, sharedObject.type)) {
            throw new ObjectError('SharedObjectTypeInvalid', 'Shared object type invalid.');
        }
        // Tercero buscamos al receptor
        const receiverUser = await User.findOne({ email });
        let isPublic = true;
        let receiver = email;
        if (receiverUser) {
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
            Object.assign(criteria, { $and: [{ object }, { $or: [{ receiverUser: receiver }, { receiverUser: email }] }, { status: true }] });
        } else {
            Object.assign(criteria, { $and: [{ object }, { receiverUser: receiver }, { status: true }] });
        }
        if (isPublic) {
            await sharedObject.setSharedExternal(receiver);
            if (sharedObject.type === 'folder') {
                await ObjectService.setSharedExternalInChildren(receiver, sharedObject.children);
            }
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
        } else if (shared && isPublic && moment().isAfter(shared.expires)) {
            shared = await Shared.refreshWebToken(shared);
        }
        // Finalmente se envia el correo para avisar al usuario receptor
        if (isPublic) {
            await EmailService.sendSharedObject(shared, emitter, receiver, sharedObject);
        } else {
            await EmailService.sendSharedPrivateObject(emitter, receiverUser, sharedObject);            
        }
        ctx.status = 204;
    }

    async revoke(ctx) {
        const { body } = ctx.request;
        const {
            object,
            email,
        } = body;
        await Shared.deleteOne({ object, receiverUser: email });
        const sharedObject = await ObjectModel.getById(object);
        await sharedObject.removeSharedExternal(email);
        if (sharedObject.type === 'folder') {
            await ObjectService.removeSharedExternalInChildren(email, sharedObject.children);
        }
        ctx.status = 204;
    }

    async validate(ctx) {
        const { body: { webToken } } = ctx.request;
        const shared = await Shared.validate(webToken);
        const {
            accessToken,
        } = shared;
        ctx.body = {
            accessToken,
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
