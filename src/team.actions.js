const { getSprints } = require('./sprints.actions');
const { getTeamId } = require('./team-data');
const { makeGetRequest } = require('./jira-client');
const { getCurrentContext } = require('./config');

async function getTeam(teamId) {
  const team = await makeGetRequest('board/' + teamId);
  delete team.self;
  return team;
}

async function describe({ id }) {
  const teamId = getTeamId(id);
  const teamObj = await getTeam(teamId);
  const sprints = await getSprints({ team: id });
  const backlog = await makeGetRequest(`board/${ teamId }/backlog?maxResults=20`);
  const stats = sprints.map(sprint => ({
    id: sprint.id,
    name: sprint.name,
    estimated: sprint.estimated,
    completed: sprint.velocity
  }));
  const points = getCurrentContext().points;
  const issues = backlog.issues.map(issue => ({
    key: issue.key,
    summary: issue.fields.summary,
    points: issue.fields[points] || '-'
  }));
  const results = Object.assign({}, teamObj, { velocity: stats }, { backlog: issues });
  const activeSprint = sprints.filter(sprint => sprint.state === 'active');
  if (activeSprint) {
    results.activeSprint = activeSprint[0];
  }
  return results;
}

async function get({ id }) {
  const teamId = getTeamId(id);
  return await getTeam(teamId);
}

module.exports = {
  get,
  describe,
  create: () => {}
};
