const { getTeamId } = require('./team-data');
const Paginator = require('./data/paginator');
const jiraClient = require('./jira-client');
const { makeGetRequest } = jiraClient;

async function getSprints({ team }, query) {
  const teamId = getTeamId(team);
  const summary = await getVelocities(teamId);
  const velocities = summary.velocityStatEntries;

  const paginator = new Paginator({
    async fetchPage(query) {
      return await makeGetRequest(`board/${ teamId }/sprint`, 'agile/1.0', { query });
    },

    processResults(result) {
      return result.values.filter(sprint => sprint.originBoardId === teamId);
    }
  });

  const sprints = await paginator.fetchAll();
  return sprints.sort((a, b) => b.id - a.id)
      .map(sprint => Object.assign({}, sprint, {
        velocity: velocities[sprint.id] ? velocities[sprint.id].completed.value : 0,
        estimated: velocities[sprint.id] ? velocities[sprint.id].estimated.value : 0
      }));
  
}

async function getVelocities(teamId, query) {
  const teamVelocities =  await makeGetRequest('rapid/charts/velocity?rapidViewId=' + teamId, 'greenhopper/1.0', { query });
  // console.log('velocity: ' + JSON.stringify(teamVelocities));
  return teamVelocities;
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
