/* eslint-disable no-console */
const { getCompletedPoints, getTotalPoints } = require('../point-reducers');
const { formatTable } = require('./table');
const { getCurrentContext } = require('../config');

function logTable(rows) {
  console.log(formatTable(rows));
}

function jsonEpicsFormatter({ epics, stories }) {
  console.error('not fully implemented');
  const finalJson = {
    epics: jsonIssueFormatter({ issues: epics }),
    stories: stories ? jsonIssueFormatter({ issues: stories }) : []
  };

  console.log(JSON.stringify(finalJson, null, 2));
}

function jsonIssueFormatter({ issues }) {
  const formattedIssues = issues.map(i => ({
    key: i.key,
    summary: i.fields.summary,
    status: i.fields.status.name
  }));

  return formattedIssues;
}

function jsonFormatter(object) {
  console.log(JSON.stringify(object, null, 2));
}

function consoleEpicsFormatter(epicsAndStories) {
  if (Array.isArray(epicsAndStories)) {
    epicsAndStories.forEach(format);
  } else {
    format(epicsAndStories);
  }

  function format({ epics, stories }) {
    console.log('Epic:');
    logTable(epics.map(epic => {
      const summary = {
        key: epic.key,
        summary: epic.summary || epic.fields.summary
      };

      summary.Completed = epic.completedPoints || '-';
      summary['Total points'] = epic.totalPoints || '-';

      return summary;
    }));

    if (stories && stories.length) {
      console.log('\nStories:');
      const points = getCurrentContext().points;

      logTable(
        stories.map(story => ({
          key: story.key,
          status: story.fields.status.name,
          summary: story.fields.summary,
          points: story.fields[points] || '-',
          sprint: (story.fields.sprint ? story.fields.sprint.name : 'N/A')
        }))
      );
    }
  }
}

function consoleSprintFormatter(sprint) {
  const points = getCurrentContext().points;
  const totalSprintPoints = getTotalPoints(sprint.issues);
  logTable([{
    name: sprint.name,
    ['start date']: sprint.startDate || 'Future Sprint',
    ['end date']: sprint.endDate || 'Future Sprint',
    ['Completed/Total points']: `${getCompletedPoints(sprint.issues)}/${totalSprintPoints}`
  }]);
  console.log();

  if (sprint.members) {
    console.log(`Members: ${sprint.members.join(', ')}`);
    console.log();
    console.log('Issues:');
    logTable(sprint.issues.map(i => ({
      key: i.key,
      status: i.fields.status.name,
      summary: i.fields.summary,
      points: i.fields[points] || '-',
      epic: i.fields.epic.key
    })));
    console.log();
  }

  console.log(`Sprint Epic Summary:`);
  logTable(sprint.epics.map(i => ({
    summary: i.displayName,
    epic: i.key,
    points: i.points,
    ['% sprint']: ((i.points / totalSprintPoints) * 100).toFixed(2)+'%',
    ['% comp']: ((i.completed / i.total) * 100).toFixed(2)+'%',
    ['total']: i.total,
    ['completed']: i.completed,
  })));
}

function consoleSprintsFormatter(sprints) {
  return logTable(sprints.map(s => ({ id: s.id, state: s.state, name: s.name, velocity: s.velocity })));
}

function consoleTeamFormatter(team) {
  logTable([{ name: team.name, id: team.id, type: team.type }]);
  if (team.velocity) {
    console.log();
    console.log('Velocity:');
    logTable(team.velocity.map(s => ({
      id: s.id,
      name: s.name,
      estimated: s.estimated.toString(),
      completed: s.completed.toString(),
      delta: (s.estimated - s.completed).toString()
    })));
  }
  if (team.activeSprint) {
    console.log();
    console.log('Current Sprint: ' + team.activeSprint.name + ' ID: ' + team.activeSprint.id);
  }
  if (team.backlog) {
    console.log();
    console.log('Backlog: ');
    console.log();
    logTable(team.backlog);
  }
}

function consoleTeamsFormatter(teams) {
  return logTable(teams.map(t => ({ id: t.id, type: t.type, name: t.name })));
}

function consoleConfigFormatter(config) {
  if (config.error) {
    console.error(`Error while creating context "${config.context}".`);
    console.error(`Reason: ${config.error}`);
    return;
  }

  console.log(`Context "${config.context}" created.`);

  if (config.defaultContext) {
    console.log(`Set default context to "${config.context}".`);
  }
}

function jsonConfigFormatter(config) {
  console.log(JSON.stringify(config, null, 2));
}

function consoleErrorFormatter({ error, context, action, id }) {
  console.log(`Received error "${ error.message }" when performing action ${ action } on context ${ context } with id ${ id }`);
}

function jsonErrorFormatter({ error, context, action, id }) {
  console.log(JSON.stringify({ error: error.message, id, context, action }, null, 2));
}


const consoleFormatters = {
  config: consoleConfigFormatter,
  epics: consoleEpicsFormatter,
  epic: consoleEpicsFormatter,
  error: consoleErrorFormatter,
  sprint: consoleSprintFormatter,
  sprints: consoleSprintsFormatter,
  team: consoleTeamFormatter,
  teams: consoleTeamsFormatter
};

const jsonFormatters = {
  config: jsonConfigFormatter,
  epics: jsonEpicsFormatter,
  epic: jsonEpicsFormatter,
  error: jsonErrorFormatter,
  sprint: jsonFormatter,
  sprints: jsonFormatter,
  team: jsonFormatter,
  teams: jsonFormatter
};

const rawFormatter = function (output) {
  console.log(JSON.stringify(output, null, 2));
};

const formatters = {
  console: consoleFormatters,
  json: jsonFormatters,
  raw: rawFormatter
};

module.exports = formatters;
