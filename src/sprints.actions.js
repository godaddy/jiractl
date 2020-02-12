const { getTeamId } = require('./team-data');
const Paginator = require('./data/paginator');
const jiraClient = require('./jira-client');
const { makeGetRequest } = jiraClient;

async function getSprints({ team }, query = {}) {
  const teamId = getTeamId(team);
  const summary = await getVelocities(teamId);
  const velocities = summary.velocityStatEntries;

  const paginator = new Paginator({
    async fetchPage(query) {
      // TODO (indexzero): support other query string params (startAt, maxResults)
      // See: https://docs.atlassian.com/jira-software/REST/7.0.4/#agile/1.0/board/{boardId}/sprint

      // TODO (indexzero): make state configurable)
      const state = 'active,future';

      return await makeGetRequest(`board/${ teamId }/sprint`, 'agile/1.0', {
        query: {
          ...query,
          state
        }
      });
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

async function getVelocities(teamId, query = {}) {
  const teamVelocities =  await makeGetRequest('rapid/charts/velocity', 'greenhopper/1.0', {
    query: {
      rapidViewId: teamId,
      ...query
    }
  });
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
