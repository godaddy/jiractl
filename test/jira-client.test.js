const { expect } = require('chai');
const nock = require('nock');
const proxyquire = require('proxyquire');

const issueResponse = require('./issue.response');
const uri = 'https://jira.com';
const context = {
  uri,
  username: 'cookie',
  password: 'butter'
};
const client = proxyquire('../src/jira-client', {
  './config': { getCurrentContext: () => (context) }
});

describe('src.jira-client', () => {
  beforeEach(() => {
    nock(uri)
      .post('/rest/auth/1/session')
      .reply(200, { session: { name: 'cookie', value: 'chocolate-chip' }})
      .get('/rest/agile/1.0/issue/GX-123')
      .reply(200, issueResponse)
      .put('/rest/agile/1.0/issue/GX-123')
      .reply(200, {});
  });

  it('gets the session cookie', async () => {
    const cookie = await client.getSessionCookie(context);
    expect(cookie).to.equal('cookie=chocolate-chip');
  });

  it('gets request options', async () => {
    const options = await client.getRequestOptions();
    expect(options).to.eql({
      json: true,
      followAllRedirects: true,
      headers: { Cookie: 'cookie=chocolate-chip' }
    });
  });

  it('makes a get request', async () => {
    const response = await client.makeGetRequest('issue/GX-123');
    expect(response).to.eql(issueResponse);
  });

  it('makes a put request', async () => {
    const response = await client.makePutRequest('issue/GX-123');
    expect(response).to.eql({});
  });
});
