const { format, URL, URLSearchParams } = require('url');
const rp = require('request-promise');
const diagnostics = require('diagnostics');
const { getCurrentContext } = require('./config');

const debug = {
  http: diagnostics('jiractl:http'),
  verbose: diagnostics('jiractl:verbose')
};

let sessionCookie;
const authmode = 'basic';

async function getRequestOptions() {
  const opts = {
    json: true,
    followAllRedirects: true,
    headers: {}
  };

  if (authmode === 'cookie' && !sessionCookie) {
    sessionCookie = await getSessionCookie();
    opts.headers.Cookie = sessionCookie;
  } else if (authmode === 'basic') {
    const { username, password } = getCurrentContext();
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    opts.headers.Authorization = `Basic ${encoded}`;
  }

  debug.verbose('HTTP Options', opts);
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

  debug.verbose(`New JIRA Session: ${session.name}=${session.value}`);
  return `${session.name}=${session.value}`;
}

function makeJiraUri({ baseUri = getCurrentContext().uri, uri, query } = {}) {
  const fullUri = new URL(`/rest/${ uri }`, `${baseUri}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      fullUri.searchParams.set(key, value);
    });
  }

  const uriStr = format(fullUri);
  debug.verbose('Make URI', uriStr);
  return uriStr;
}

async function makeQuery({ jql, selector = (results) => results.total } = {}) {
  const { points } = getCurrentContext();

  const opts = await getRequestOptions();
  const uri = makeJiraUri({ uri: 'api/2/search' });
  debug.http(`POST ${uri}`);

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

  return selector(response);
}

async function makeGetRequest(url, api = 'agile/1.0', options = {}) {
  const opts = await getRequestOptions();
  const uri = makeJiraUri({ uri: `${api}/${url}`, query: options.query });
  const fullOpts = Object.assign({}, opts, options, {
    method: 'GET',
    uri
  });

  debug.http(`GET ${uri}`, fullOpts);
  return await rp(fullOpts);
}

async function makePutRequest(url, api = 'agile/1.0', data = {}) {
  const opts = await getRequestOptions();
  const uri = makeJiraUri({ uri: `${api}/${url}` });
  debug.http(`PUT ${uri}`);

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
