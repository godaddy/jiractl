const { expect } = require('chai');
const nock = require('nock');
const proxyquire = require('proxyquire');

const issueResponse = require('./issue.response');
const uri = 'https://jira.com';
const context = {
  uri,
  username: 'cookie',
  password: 'butter',
  points: 'customfield_1'
};
const client = proxyquire('../src/jira-client', {
  './config': { getCurrentContext: () => (context) }
});

describe('src.jira-client', () => {
  describe('.getSessionClient', () => {
    it('gets the session cookie', async () => {
      nock(uri)
        .post('/rest/auth/1/session')
        .reply(200, { session: { name: 'cookie', value: 'chocolate-chip' } });
      const cookie = await client.getSessionCookie(context);
      expect(cookie).to.equal('cookie=chocolate-chip');
    });

    it('rethrows login failure errors from the Jira API', async () => {
      nock(uri)
        .post('/rest/auth/1/session')
        .reply(401, { errorMessages: ['Login failed'] });
      let error;
      try {
        await client.getSessionCookie(context);
      } catch (err) {
        error = err;
      }
      expect(error.message).to.equal('Login failed');
    });

    it('throws request errors', async () => {
      nock(uri)
        .post('/rest/auth/1/session')
        .reply(404, { message: 'ENOTFOUND jira.foo.com' });
      let error;
      try {
        await client.getSessionCookie(context);
      } catch (err) {
        error = err;
      }
      expect(error.message).to.equal('404 - {"message":"ENOTFOUND jira.foo.com"}');
    });
  });

  describe('.getRequestOptions', () => {
    it('gets request options', async () => {
      nock(uri)
        .post('/rest/auth/1/session')
        .reply(200, { session: { name: 'cookie', value: 'chocolate-chip' } });
      const options = await client.getRequestOptions();
      expect(options).to.eql({
        json: true,
        followAllRedirects: true,
        headers: { Cookie: 'cookie=chocolate-chip' }
      });
    });
  });

  describe('.makeGetRequest', () => {
    beforeEach(() => {
      nock(uri)
        .post('/rest/auth/1/session')
        .reply(200, { session: { name: 'cookie', value: 'chocolate-chip' } });
    });

    it('makes a get request', async () => {
      nock(uri)
        .get('/rest/agile/1.0/issue/GX-123')
        .reply(200, issueResponse);
      const response = await client.makeGetRequest('issue/GX-123');
      expect(response).to.eql(issueResponse);
    });

    it('rethrows a get request error from the jira api', async () => {
      nock(uri)
        .get('/rest/agile/1.0/issue/GX-123')
        .reply(400, { errorMessages: ['something', 'went', 'wrong'] });
      let error;
      try {
        await client.makeGetRequest('issue/GX-123');
      } catch (err) {
        error = err;
      }
      expect(error.message).to.equal('something, went, wrong');
    });
  });

  describe('.makePutRequest', () => {
    beforeEach(() => {
      nock(uri)
        .post('/rest/auth/1/session')
        .reply(200, { session: { name: 'cookie', value: 'chocolate-chip' } });
    });

    it('makes a put request', async () => {
      nock(uri)
        .put('/rest/agile/1.0/issue/GX-123')
        .reply(200, {});
      const response = await client.makePutRequest('issue/GX-123');
      expect(response).to.eql({});
    });

    it('rethrows a put request error from the jira api', async () => {
      nock(uri)
        .put('/rest/agile/1.0/issue/GX-123')
        .reply(400, { errorMessages: ['something', 'went', 'wrong'] });
      let error;
      try {
        await client.makePutRequest('issue/GX-123');
      } catch (err) {
        error = err;
      }
      expect(error.message).to.equal('something, went, wrong');
    });
  });

  describe('.makeQuery', () => {
    beforeEach(() => {
      nock(uri)
        .post('/rest/auth/1/session')
        .reply(200, { session: { name: 'cookie', value: 'chocolate-chip' } });
    });

    it('makes a jql query and applies the selector', async () => {
      nock(uri)
        .post('/rest/api/2/search')
        .reply(200, { id: 111, issues: [1, 2] });
      const response = await client.makeQuery({ jql: 'key=111', selector: results => results.issues });
      expect(response).to.eql([1, 2]);
    });

    it('rethrows a put request error from the jira api', async () => {
      nock(uri)
        .post('/rest/api/2/search')
        .reply(400, { errorMessages: ['something', 'went', 'wrong'] });
      let error;
      try {
        await client.makeQuery({ jql: 'key=111', selector: results => results.issues });
      } catch (err) {
        error = err;
      }
      expect(error.message).to.equal('something, went, wrong');
    });
  });
});
