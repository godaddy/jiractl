/* eslint-disable no-console */
const { formatTable } = require('./table');

function describe(issue) {
  console.log('Issue');
  console.log(issue.key);
  console.log();
  console.log('Summary');
  console.log(issue.summary);
  console.log();
  console.log('Description');
  console.log(issue.description);
  console.log();
  describeDetails(issue);
}

function describeDetails(issue) {
  console.log('Creator: ', issue.creator);
  console.log('Assignee: ', issue.assignee);
  console.log('Status: ', issue.status);
  console.log('Priority: ', issue.priority);
  console.log('Epic: ', issue.epic);
  console.log('Sprint: ', issue.sprint);
  console.log('Points: ', issue.points);
}

function get(issue) {
  console.log('Summary');
  console.log(issue.summary);
  console.log();
  console.log(formatTable([{
    key: issue.key,
    points: issue.points,
    assignee: issue.assignee,
    sprint: issue.sprint,
    epic: issue.epic,
    status: issue.status
  }]));
}

function update(issue) {
  console.log(formatTable([issue]));
}

function jsonDefault({ issues }) {
  const formattedIssues = issues.map(i => ({
    key: i.key,
    summary: i.fields.summary,
    status: i.fields.status.name
  }));

  return formattedIssues;
}

module.exports = {
  console: {
    describe,
    get,
    update
  },
  json: {
    default: jsonDefault
  }
};
