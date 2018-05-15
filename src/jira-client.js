const rp = require('request-promise');
const { getCurrentContext } = require('./config');

let sessionCookie;

async function getRequestOptions() {
  if (!sessionCookie) {
    sessionCookie = await getSessionCookie();
  }

  return {
    json: true,
    followAllRedirects: true,
    headers: {
      Cookie: sessionCookie
    }
  };
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
  return `${session.name}=${session.value}`;
}

function makeJiraUri({ baseUri = getCurrentContext().uri, uri } = {}) {
  return `${baseUri}/rest/${ uri }`;
}

async function makeQuery({ jql, selector = (results) => results.total } = {}) {
  const points = getCurrentContext().points;
  const response = await rp(Object.assign({}, await getRequestOptions(), {
    method: 'POST',
    uri: makeJiraUri({ uri: 'api/2/search' }),
    body: {
      jql,
      startAt: 0,
      maxResults: 10000,
      fields: ['summary', 'status', 'assignee', 'description', points],
      expand: ['schema', 'names']
    }
  }));
  return selector(response);
}

async function makeGetRequest(url, api = 'agile/1.0', options = {}) {
  return await rp(Object.assign({}, await getRequestOptions(), options, {
    method: 'GET',
    uri: makeJiraUri({ uri: `${api}/${url}` })
  }));
}

async function makePutRequest(url, api = 'agile/1.0', data = {}) {
  return await rp(Object.assign({}, await getRequestOptions(), {
    method: 'PUT',
    uri: makeJiraUri({ uri: `${api}/${url}` }),
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
