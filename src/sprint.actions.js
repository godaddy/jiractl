const { getTeamId } = require('./team-data');
const client = require('./jira-client');

async function describe({ team, id }) {
  const teamId = getTeamId(team);
  const sprint = await client.makeGetRequest(`sprint/${ id }`);
  const issues = await client.makeGetRequest(`board/${ teamId }/sprint/${ id }/issue`);
  const members = [...new Set(issues.issues.filter(issue => issue.fields.assignee).map(
    issue => issue.fields.assignee.displayName))];

  return {
    id: sprint.id,
    name: sprint.name,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    state: sprint.state,
    issues: issues.issues,
    members
  };
}

module.exports = {
  get: describe,
  describe,
  create: () => {}
};
