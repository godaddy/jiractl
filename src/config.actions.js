const readlineSync = require('readline-sync');
const jiraClient = require('./jira-client');
const { getSessionCookie, makeGetRequest } = jiraClient;
const config = require('./config');
const { addContext, addPoints, setCurrentContext, getCurrentContext } = config;

function getInput({ username, password }) {
  if (!username) {
    username = readlineSync.question('Username: ');
  }

  if (!password) {
    password = readlineSync.question('Password: ', { hideEchoBack: true, mask: '' });
  }
  return { username, password };
}

async function setContext({ id, username, password }) {
  const context = id;
  let error, defaultContext, points;

  ({ username, password } = getInput({ username, password }));

  try {
    await getSessionCookie({ baseUri: context, username, password });
    addContext({ context, username, password });

    if (!getCurrentContext()) {
      defaultContext = context;
      setCurrentContext(context);
    }

    ({ error, points } = await getEstimator());
    if (points) {
      addPoints({ context, points });
    }
  } catch (err) {
    error = err;
  }

  return { context, username, password, points, defaultContext, error };
}

async function getEstimator() {
  let points, error;
  try {
    const fields = await makeGetRequest('field', 'api/2');
    const pointsField = fields.filter(field => field.name === 'Story Points');
    if (pointsField.length) {
      points = pointsField[0].id;
    } else {
      error = new Error('No points field configured');
    }
  } catch (err) {
    error = err;
  }
  return { error, points };
}

module.exports = {
  'set-context': setContext,
  getEstimator
};
