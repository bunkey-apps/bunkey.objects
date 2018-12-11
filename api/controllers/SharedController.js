class SharedController {
    async create(ctx) {
        const { body } = ctx.request;
        const {
            object,
            emitterUser,
            name,
            email,
        } = body;
        let shared = await Shared.findOne({ object, 'receiverUser.email': email });
        if (shared) {
            throw new ObjectError('ObjectAlreadyShared', 'The object was already shared with this user.');
        }
        let response = await UserService.getById(emitterUser);
        const emitter = response.body;
        response = await UserService.getByEmail(email);
        const receiver = {};
        if (response.body.length === 1) {
            Object.assign(receiver, response.body[0]);
        } else {
            Object.assign(receiver, { _id: null, name, email });
        }
        const sharedObject = await ObjectModel.getById(object);
        shared = await Shared.create({
            client: sharedObject.client,
            object,
            emitterUser,
            receiverUser: receiver,
        });
        await EmailService.sendSharedObject(shared, emitter, receiver, sharedObject);
        ctx.status = 204;
    }

    async validate(ctx) {
        const { body } = ctx.request;
        const { webToken } = body;
        const shared = await Shared.validate(webToken);
        const { accessToken } = shared;
        ctx.body = { accessToken };
        ctx.status = 200;
    }
}

module.exports = SharedController;
