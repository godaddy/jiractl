const jiraClient = require('./jira-client');
const { makeGetRequest } = jiraClient;
const { getTeamId } = require('./team-data');
const { describe: describeEpic } = require('./epic.actions');

async function getEpics({ team }) {
  const id = getTeamId(team);
  const result = await makeGetRequest(`board/${ id }/epic`);
  const epics = result.values.filter(epic => !epic.done);
  return { epics };
}

async function describeEpics({ team }) {
  const { epics } = await getEpics({ team });
  const epicsAndStories = await Promise.all(
    epics.map(async epic => {
      const epicData = await describeEpic({ id: epic.key });
      return epicData;
    })
  );

  return epicsAndStories;
}

module.exports = {
  get: getEpics,
  describe: describeEpics,
  create: () => {}
};
