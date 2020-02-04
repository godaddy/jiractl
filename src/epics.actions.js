const { getTeamId } = require('./team-data');
const { describe: describeEpic, status: statusEpic } = require('./epic.actions');
const Paginator = require('./data/paginator');
const jiraClient = require('./jira-client');
const { makeGetRequest } = jiraClient;

async function getEpics({ team }) {
  const id = getTeamId(team);

  const paginator = new Paginator({
    async fetchPage(query) {
      return await makeGetRequest(`board/${ id }/epic`, 'agile/1.0', { query });
    },

    processResults(result) {
      return result.values.filter(epic => !epic.done);
    }
  });

  const epics = await paginator.fetchAll();
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

async function statusEpics({ team }) {
  const { epics } = await getEpics({ team });
  const epicsAndStories = await Promise.all(
    epics.map(async epic => statusEpic({ id: epic.key }))
  );

  

  return epicsAndStories;
}

module.exports = {
  get: getEpics,
  describe: describeEpics,
  status: statusEpics,
  create: () => {}
};
