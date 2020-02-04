const { describe: describeEpic, status: statusEpic } = require('./epic.actions');
const { getTeamId } = require('./team-data');
// const { statusEpic } = require('./epic.actions')
const client = require('./jira-client');
const { getCurrentContext } = require('./config');
const { getCompletedPoints, getTotalPoints } = require('./point-reducers');


async function describe({ team, id }) {
  const teamId = getTeamId(team);
  const sprint = await client.makeGetRequest(`sprint/${ id }`);
  const issues = await client.makeGetRequest(`board/${ teamId }/sprint/${ id }/issue`);
  const epics = await getIssueEpics(issues);

  const members = [...new Set(issues.issues.filter(issue => issue.fields.assignee).map(
    issue => issue.fields.assignee.displayName))];

  return {
    id: sprint.id,
    name: sprint.name,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    state: sprint.state,
    issues: issues.issues,
    epics: epics,
    members
  };
}

async function status({ team, id }) {
  const teamId = getTeamId(team);
  const sprint = await client.makeGetRequest(`sprint/${ id }`);
  const issues = await client.makeGetRequest(`board/${ teamId }/sprint/${ id }/issue`);
  const epics = await getIssueEpics(issues);

  return {
    id: sprint.id,
    name: sprint.name,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    state: sprint.state,
    issues: issues.issues,
    epics: epics
  };
}

async function getIssueEpics(epicIssues) {
  const points = getCurrentContext().points;
  // Summarize epic issues - distinct epics to total epic issue points in sprint & summary
  let epicSummary = epicIssues.issues.reduce(function(map, issue) {    
    // TO-DO: handle error if issue does not have an epic
    const key = issue.fields.epic.key;
    const sprintPoints = +issue.fields[points];

    map[key] = map[key] || {};
    map[key].sprintPoints = (map[key].sprintPoints + sprintPoints) || sprintPoints;
    map[key].summary = issue.fields.epic.name || issue.fields.epic.fields.name;

    return map;
  }, {});

  // final output object w/ all needed fields
  const array = await Promise.all(
    Object.keys(epicSummary).map(async function(name) {
      let epicData = await statusEpic({ id: name });
      return {
        key: name,
        displayName: epicSummary[name].summary,
        points: epicSummary[name].sprintPoints,
        total: epicData.epics[0].totalPoints,
        completed: epicData.epics[0].completedPoints,
      }
    })
  );

  return array;
}


module.exports = {
  get: describe,
  describe,
  status,
  create: () => {}
};