const { getTeamId } = require('./team-data');
const client = require('./jira-client');

async function pageSprints(teamId, startAt = 0) {
  const sprints = await client.makeGetRequest(`board/${ teamId }/sprint?startAt=${ startAt }`);
  let sprintValues = sprints.values;

  if (!sprints.isLast) {
    const nextPage = await pageSprints(teamId, startAt + 50);
    sprintValues = sprintValues.concat(nextPage);
  }

  return sprintValues;
}

async function getSprints({ team }) {
  const teamId = getTeamId(team);
  const summary = await getVelocities(teamId);
  const velocities = summary.velocityStatEntries;
  const sprints = await pageSprints(teamId);

  return sprints
    .filter(sprint => sprint.originBoardId === teamId)
    .sort((a, b) => b.id - a.id)
    .map(sprint => Object.assign({}, sprint, {
	    velocity: velocities[sprint.id] ? velocities[sprint.id].completed.value : 0,
	    estimated: velocities[sprint.id] ? velocities[sprint.id].estimated.value : 0
    }));
}

async function getVelocities(teamId) {
  return await client.makeGetRequest('rapid/charts/velocity?rapidViewId=' + teamId, 'greenhopper/1.0');
}

async function describe({ team }) {
  return await getSprints({ team });
}

module.exports = {
  create: () => {},
  describe,
  get: describe,
  getSprints,
  getVelocities
};
