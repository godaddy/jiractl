const { expect } = require('chai');
const proxyquire = require('proxyquire');
const clientStub = {};
const issueResponse = require('./issue.response');
const sprintActions = proxyquire('../src/sprint.actions', { './jira-client': clientStub });

const sprintId = 123;
const sprintData = {
  id: sprintId,
  state: 'active',
  name: 'Cats 4/23-5/4',
  startDate: '2018-04-23',
  endDate: '2018-05-04'
};
const sprintResponse = Object.assign({}, sprintData, {
  self: `https://jira.com/rest/agile/1.0/sprint/${ sprintId }`,
  originBoardId: 1,
  goal: ''
});
const sprintIssuesResponse = {
  expand: 'schema,names',
  startAt: 0,
  maxResults: 50,
  total: 2,
  issues: [issueResponse, issueResponse]
};

describe('src.sprint.actions', () => {

  beforeEach(() => {
    clientStub.makeGetRequest = (endpoint) => {
      return endpoint === `sprint/${ sprintId }` ? sprintResponse : sprintIssuesResponse;
    };
  });

  it('gets a sprint by id', async () => {
    const sprint = await sprintActions.get({ team: 'cats', id: sprintId });
    expect(sprint).to.eql(Object.assign({}, sprintData, { members: ['Foo Bar'], issues: [issueResponse, issueResponse] }));
  });

  it('describes a sprint by id', async () => {
    const sprint = await sprintActions.describe({ team: 'cats', id: sprintId });
    expect(sprint).to.eql(Object.assign({}, sprintData, { members: ['Foo Bar'], issues: [issueResponse, issueResponse] }));
  });

});
