const prompts = require('prompts');
const diagnostics = require('diagnostics');
const jiraClient = require('./jira-client');
const { getSessionCookie, makeGetRequest } = jiraClient;
const config = require('./config');
const { addContext, addPoints, setCurrentContext, getCurrentContext } = config;
const debug = diagnostics('jiractl:config');

async function getInput({ username, password, authmode }) {
  const inputs = await prompts([
    !username && {
      type: 'text',
      name: 'username',
      message: 'Jira username?'
    },
    !password && {
      type: 'password',
      name: 'password',
      message: 'Jira password?'

    },
    !authmode && {
      type: 'toggle',
      name: 'authmode',
      message: 'Use HTTP Basic Auth?',
      initial: true,
      active: 'yes',
      inactive: 'no',
      format: basicauth => basicauth && 'basic' || 'cookie'
    }
  ].filter(Boolean));

  return {
    username: username || inputs.username,
    password: password || inputs.password,
    authmode: authmode || inputs.authmode
  };
}

async function setContext({ id, username, password, authmode }) {
  const context = id;
  let defaultContext;

  ({ username, password, authmode } = await getInput({ username, password, authmode }));

  debug('Set context: %j', { username, authmode });
  if (authmode === 'cookie') {
    await getSessionCookie({ baseUri: context, username, password });
  }

  addContext({ context, username, password, authmode });

  if (!getCurrentContext()) {
    defaultContext = context;
    setCurrentContext(context);
  }

  const points = await getEstimator();
  addPoints({ context, points });

  return { context, username, password, authmode, points, defaultContext };
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
