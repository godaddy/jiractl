const { makeGetRequest } = require('./jira-client');

async function getTeams({ id }) {
  const teams = await makeGetRequest('board', 'agile/1.0', { query: { projectKeyOrId: id } });
  return teams.values;
}

async function get({ id }) {
  const teams = await getTeams({ id });
  return teams.map(team => ({
    id: team.id,
    name: team.name,
    type: team.type
  }));
}

module.exports = {
  create: () => {},
  describe: get,
  get,
  getTeams
};
