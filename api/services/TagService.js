const INIT_ACTION = 'init';
const READY_ACTION = 'ready';

class TagService {
  async process(msg) {
    const content = JSON.parse(msg.content.toString());
    cano.log.info('TagService -> process -> msg:', content);
    if (!content) {
      return cano.log.warn('TagService -> process -> Invalid content:', msg.content.toString());
    }
    switch (content.context) {
      case 'IMAGE-TAGGING':
        processImage(content);
        break;
      case 'VIDEO-INIT-TAGGING':
        processVideo(INIT_ACTION, content);
        break;
      case 'VIDEO-TAGGING':
        processVideo(READY_ACTION, content);
        break;
      default:
        break;
    }
  }
}

async function processImage(content) {
  if (content.status === 'ERROR') {
    return cano.log.error('TagService -> process -> Invalid imagen content:', content.amazonError);
  }
  const { objUUID: uuid, result } = content;
  const data = {
    uuid, 
    result,
    ready: true,
  };
  await AutoTags.create(data);
}

async function processVideo(action, content) {
  if (content.status === 'ERROR') {
    return cano.log.error('TagService -> process -> Invalid video content:', content.amazonError);
  }
  if (action === INIT_ACTION) {
    const { amazonJobId: jobId, objUUID: uuid } = content;
    const data = {
      jobId,
      uuid,
    };
    await AutoTags.create(data);
  } else if (action === READY_ACTION) {
    const { amazonJobId: jobId, result } = content;
    const autoTags = await AutoTags.findOne({ jobId });
    await autoTags.setResult(result);
  }
}

module.exports = TagService;
