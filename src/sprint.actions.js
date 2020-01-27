// const { describe: describeEpic, status: statusEpic } = require('./epic.actions');
const { getTeamId } = require('./team-data');
const { statusEpic } = require('./epic.actions')
const client = require('./jira-client');
const { getCurrentContext } = require('./config');


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

async function getIssueEpics(epicIssues) {
  const points = getCurrentContext().points;
  // map epic issues - distinct epics to total epic issue points in sprint
  let map = epicIssues.issues.reduce(function(map, issue) {
    let key = issue.fields.epic.key
    let name = issue.fields.epic.name || issue.fields.epic.fields.name
    let epicPoints = +issue.fields[points]
    map[key] = (map[key] || 0) + epicPoints
    return map
  }, {})

  const groupBy = (array, key) => {
    return array.reduce((result, currentValue) => {
      (result[currentValue.fields.epic.key] = result[currentValue.fields.epic.key] || [] ).push(
        {
          summary: currentValue.fields.epic.name || currentValue.fields.epic.fields.name
        }
      );

      return result;
    }, {});
  };
  const epicGroupedByKey = groupBy(epicIssues.issues, "fields.epic.key");
  
  let array = Object.keys(map).map(function(name) {
    return {
      key: name,
      displayName: epicGroupedByKey[name][0].summary,
      points: map[name]
    }
  })
      // console.log(array);

  return array;
}


module.exports = {
  get: describe,
  describe,
  create: () => {}
};