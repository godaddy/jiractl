const { expect } = require('chai');
const proxyquire = require('proxyquire');
const clientStub = {};
const configStub = {};
const issueActions = proxyquire('../src/issue.actions', {
  './jira-client': clientStub,
  './config': configStub
});

const issueResponse = require('./issue.response');

describe('src.issue.actions', () => {
  beforeEach(() => {
    clientStub.makeGetRequest = () => issueResponse;
    configStub.getCurrentContext = () => { return { points: 'customfield_10004' }; };
  });

  it('gets an issue by key', async () => {
    const issue = await issueActions.getIssue('GX-123');
    expect(issue).to.have.all.keys(['expand', 'id', 'self', 'key', 'fields']);
  });

  it('extracts `get` fields from an issue response', async () => {
    const issue = await issueActions.get.action({ id: 'GX-123' });
    expect(issue).to.eql({
      summary: issueResponse.fields.summary,
      status: issueResponse.fields.status.name,
      epic: issueResponse.fields.epic.key,
      sprint: `${ issueResponse.fields.sprint.name }, ${ issueResponse.fields.closedSprints[0].name }`,
      assignee: issueResponse.fields.assignee.name,
      key: issueResponse.key,
      points: issueResponse.fields.customfield_10004
    });
  });
});
