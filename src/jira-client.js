const rp = require('request-promise');
const { getCurrentContext } = require('./config');

let sessionCookie;

async function getRequestOptions() {
  if (!sessionCookie) {
    sessionCookie = await getSessionCookie();
  }

  const opts = {
    json: true,
    followAllRedirects: true,
    headers: {
      Cookie: sessionCookie
    }
  };

  // TODO: Make this a debug log output
  // console.dir(opts);
  return opts;
}

async function getSessionCookie({
  baseUri = getCurrentContext().uri,
  username = getCurrentContext().username,
  password = getCurrentContext().password } = {}
) {
  const { session } = await rp({
    method: 'POST',
    uri: makeJiraUri({ baseUri, uri: 'auth/1/session' }),
    body: {
      username,
      password
    },
    json: true,
    followAllRedirects: true
  });

  console.log(`New JIRA Session: ${session.name}=${session.value}`)
  return `${session.name}=${session.value}`;
}

function makeJiraUri({ baseUri = getCurrentContext().uri, uri } = {}) {
  return `${baseUri}/rest/${ uri }`;
}

async function makeQuery({ jql, selector = (results) => results.total } = {}) {
  const points = getCurrentContext().points;

  const opts = await getRequestOptions();
  const uri = makeJiraUri({ uri: 'api/2/search' });
  console.dir(`POST ${uri}`);

  // TODO: move to fetch from rp
  const response = await rp(Object.assign({}, opts, {
    method: 'POST',
    uri,
    body: {
      jql,
      startAt: 0,
      maxResults: 10000,
      fields: ['summary', 'status', 'assignee', 'description', points],
      expand: ['schema', 'names']
    }
  }));

  // TODO: Make this a debug log output
  // console.dir(response);
  return selector(response);
}

async function makeGetRequest(url, api = 'agile/1.0', options = {}) {
  const opts = await getRequestOptions();
  const uri = makeJiraUri({ uri: `${api}/${url}` });
  console.dir(`GET ${uri}`);

  return await rp(Object.assign({}, opts, options, {
    method: 'GET',
    uri
  }));
}

async function makePutRequest(url, api = 'agile/1.0', data = {}) {
  const opts = await getRequestOptions();
  const uri = makeJiraUri({ uri: `${api}/${url}` });
  console.dir(`PUT ${uri}`);

  return await rp(Object.assign({}, opts, {
    method: 'PUT',
    uri,
    body: data
  }));
}

module.exports = {
  getRequestOptions,
  getSessionCookie,
  makeGetRequest,
  makePutRequest,
  makeQuery
};
