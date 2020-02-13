const { expect } = require('chai');
const proxyquire = require('proxyquire');

const team = 1;
const sprintsData = {
  maxResults: 50,
  startAt: 0,
  isLast: true,
  values: [{
    id: 1,
    self: 'https://jira.com/rest/agile/1.0/sprint/1',
    state: 'active',
    name: 'Cats 4/23-5/4',
    startDate: '2018-04-23',
    endDate: '2018-05-05',
    originBoardId: team,
    goal: ''
  }, {
    id: 2,
    self: 'https://jira.com/rest/agile/1.0/sprint/2',
    state: 'closed',
    name: 'Cats 4/9-4/20',
    startDate: '2018-04-09',
    endDate: '2018-04-20',
    originBoardId: team,
    goal: ''
  }]
};
const velocityData = {
  sprints: [{
    id: 1,
    sequence: 1,
    name: 'Cats 4/23-5/4',
    state: 'ACTIVE',
    goal: '',
    linkedPagesCount: 0
  }, {
    id: 2,
    sequence: 2,
    name: 'Cats 4/9-4/20',
    state: 'CLOSED',
    goal: '',
    linkedPagesCount: 0
  }],
  velocityStatEntries: {
    2: { estimated: { value: 51, text: '51.0' },
	  completed: { value: 30, text: '30.0' } }
  }
};

const clientStub = {};
const sprintsActions = proxyquire('../src/sprints.actions', { './jira-client': clientStub });

describe('src.sprints.actions', () => {

  beforeEach(() => {
    clientStub.makeGetRequest = (endpoint) => {
      return endpoint === `board/${ team }/sprint` ? sprintsData : velocityData;
    };
  });

  it('gets velocities for a team', async () => {
    const velocities = await sprintsActions.getVelocities(team);
    expect(velocities).to.eql(velocityData);
  });

  it('gets sprints for a team', async () => {
    const sprints = await sprintsActions.get({ team });
    const expected = [
      Object.assign({ velocity: 30, estimated: 51 }, sprintsData.values[1]),
      Object.assign({ velocity: 0, estimated: 0 }, sprintsData.values[0])
    ];
    expect(sprints).to.eql(expected);
  });

  it('describes sprints for a team', async () => {
    const sprints = await sprintsActions.describe({ team });
    const expected = [
      Object.assign({ velocity: 30, estimated: 51 }, sprintsData.values[1]),
      Object.assign({ velocity: 0, estimated: 0 }, sprintsData.values[0])
    ];
    expect(sprints).to.eql(expected);
  });
});
