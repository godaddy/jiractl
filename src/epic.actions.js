const editContents = require('./edit-contents');
const { formatBody, parseBody } = require('./formatters/table');
const jiraClient = require('./jira-client');
const { makeQuery, makeGetRequest, makePutRequest } = jiraClient;
const { getCompletedPoints, getTotalPoints } = require('./point-reducers');

async function getEpic({ id }) {
  const epics = await makeQuery({
    jql: `key=${id}`,
    selector: results => results.issues
  });
  return {
    epics
  };
}

async function describeEpic({ id }) {
  const { epics } = await getEpic({ id });
  const epicIssues = await makeGetRequest(`epic/${id}/issue`);
  if (!epicIssues) {
    throw new Error(`No issues returned for: ${id}`);
  }
   
  const stories = epicIssues.issues;

  epics[0].totalPoints = getTotalPoints(stories);
  epics[0].completedPoints = getCompletedPoints(stories);

  return {
    epics,
    stories
  };
}

async function statusEpic({ id }) {
  const epic = await getEpic({ id });
  const epicIssues = await makeGetRequest(`epic/${id}/issue`);
  if (!epicIssues) {
    throw new Error(`No issues returned for: ${id}`);
  }
   
  const stories = epicIssues.issues;

  epic.epics[0].totalPoints = getTotalPoints(stories);
  epic.epics[0].completedPoints = getCompletedPoints(stories);

  return epic || {};
}

async function edit({ id }) {
  const issues = (await makeGetRequest(`epic/${ id }/issue`)).issues;
  const rows = issues.map(i => ({
    key: i.key,
    status: i.fields.status.name,
    summary: i.fields.summary
  }));

  const editedIssues = parseBody(await editContents({
    content: `${ formatBody(rows) }\n\n# Re-order issues to update priority`,
    prefix: 'jiractl-edit-',
    postfix: '.txt'
  })).map(values => ({
    key: values[0]
  }));

  const updated = editedIssues.find((issue, index) => {
    if (issue.key !== rows[index].key) return true;
  });
  if (!updated) return { message: `No updates to Epic ${ id }` };

  const rankData = [{
    issues: [editedIssues[0].key],
    rankBeforeIssue: editedIssues[1].key
  }];
  for (let index = 1; index < editedIssues.length; index++) {
    rankData.push({
      issues: [editedIssues[index].key],
      rankAfterIssue: editedIssues[index - 1].key
    });
  }

  const errors = [];
  await Promise.all(rankData.map(async rankDatum => {
    const res = await makePutRequest('issue/rank', 'agile/1.0', rankDatum);
    if (res && res.entries[0].errors) {
      Array.prototype.push.apply(errors, res.entries[0].errors);
    }
  }));

  if (errors.length) {
    throw new Error(`Failed to update issue ordering: ${ errors }`);
  }
  return { message: `Updated Epic ${ id }` };
}

module.exports = {
  get: getEpic,
  describe: describeEpic,
  status: statusEpic,
  edit: {
    action: edit,
    formatters: {
      console: result => console.log(result.message) // eslint-disable-line no-console
    }
  },
  create: () => {}
};
