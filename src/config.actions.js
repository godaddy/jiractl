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
  let defaultContext;

  ({ username, password } = getInput({ username, password }));

  await getSessionCookie({ baseUri: context, username, password });
  addContext({ context, username, password });

  if (!getCurrentContext()) {
    defaultContext = context;
    setCurrentContext(context);
  }

  const points = await getEstimator();
  addPoints({ context, points });

  return { context, username, password, points, defaultContext };
}

async function getEstimator() {
  let points;
  const fields = await makeGetRequest('field', 'api/2');
  const pointsField = fields.filter(field => field.name === 'Story Points');
  if (pointsField.length) {
    points = pointsField[0].id;
  } else {
    throw new Error('No points field configured');
  }
  return points;
}

module.exports = {
  'set-context': setContext,
  getEstimator
};
