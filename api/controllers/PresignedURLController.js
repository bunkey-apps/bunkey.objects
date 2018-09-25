import uuidv1 from 'uuid/v1';

/**
 * @class PresignedURLController for handle SignedUrl
 * @author Antonio Mejias
 */

class PresignedURLController {
    async create(ctx) {
        cano.log.debug('Here');
        
        const { request: { body } } = ctx;
        const payload = Array.isArray(body) ? body : [body];
        // 1ea07ec8-ae55-4a82-ae75-983140201912
        const uuid = uuidv1();
        const promises = payload.map(({ clientId, extention, ...data }) => {
            const params = { ...data, Key: `${uuid}.${extention}`, uuid };
            return S3Service.getPresignedURL(params);
        });
        const [collection] = await Promise.all(promises);
        ctx.status = 200;
        ctx.body = collection;
    }
}

export default PresignedURLController;
