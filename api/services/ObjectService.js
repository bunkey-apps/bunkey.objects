import forEach from 'lodash/forEach';
import map from 'lodash/map';

class ObjectService {
  setSharedExternalInChildren(email, children) {
    return applyShareAction('set', email, children);
  }

  removeSharedExternalInChildren(email, children) {
    return applyShareAction('remove', email, children);
  }
}

async function applyShareAction(action, email, children) {
  if (children.length === 0) return;
  const promises = map(children, _id => ObjectModel.findOne({ _id }));
  const objects = await Promise.all(promises);
  await Promise.all(map(objects, (object) => {
    if (action === 'set') {
      return object.setSharedExternal(email);
    } else if (action === 'remove') {
      return object.removeSharedExternal(email);
    }
  }));
  const subChildren = [];
  forEach(objects, (object) => {
    if (object.type === 'folder') {
      subChildren.push(applyShareAction(action, email, object.children));
    }
  });
  if (subChildren.length) {
    await Promise.all(subChildren);
  }
}

export default ObjectService;
