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


/**
 * All epic details and corresponding stories for all epics associated to a team
 * w/ total and completed points
 * @param  {string} team - The team alias or id, ie: "foo" or "1234"
 * @returns {obj} epicsAndStories - The team epics and their associated stories
 */
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

/**
 * Simplified epic with total and completed points for all epics associated to a team
 * @param  {string} team - The team alias or id, ie: "foo" or "1234"
 * @returns {obj} mappedEpics - The team epics and their associated additional details
 */
async function statusEpics({ team }) {
  const { epics } = await getEpics({ team });
  const mappedEpics = await Promise.all(
    epics.map(async epic => statusEpic({ id: epic.key }))
  );

  return mappedEpics;
}

module.exports = {
  get: getEpics,
  describe: describeEpics,
  status: statusEpics,
  create: () => {}
};
