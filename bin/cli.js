#!/usr/bin/env node
/* eslint-disable max-statements */

const configActions = require('../src/config.actions');
const epicActions = require('../src/epic.actions');
const epicsActions = require('../src/epics.actions');
const formatters = require('../src/formatters');
const { getCurrentContext } = require('../src/config');
const { writeTeamAlias, writeTeamsData } = require('../src/team-data');
const issueActions = require('../src/issue.actions');
const sprintActions = require('../src/sprint.actions');
const sprintsActions = require('../src/sprints.actions');
const teamActions = require('../src/team.actions');
const teamsActions = require('../src/teams.actions');

const opn = require('opn');
const yargs = require('yargs')
  .usage('Usage: jiractl --team=orange-cats [action] [context]')
  .default('output', 'console')
  .alias('t', 'team')
  .alias('o', 'output')
  .describe('o', 'Pick output format')
  .choices('o', ['console', 'json']);

const argv = yargs.argv;

let action = argv._[0]; // get, update, describe
let context = argv._[1]; // epic(s), sprint(s), team(s)
const id = argv._[2]; // e.g. sprint id, project id
argv.id = id;

require('tabtab')().start();

const handlers = {
  config: configActions,
  epic: epicActions,
  epics: epicsActions,
  issue: issueActions,
  sprint: sprintActions,
  sprints: sprintsActions,
  team: teamActions,
  teams: teamsActions
};

async function main() {
  if (!action) {
    yargs.showHelp();
    return;
  }

  if (action === 'open') {
    const itemKey = context;
    await opn(`${ getCurrentContext().uri }/browse/${ itemKey }`);
    return;
  }

  if (action === 'setup') {
    const project = context;
    await writeTeamsData(project);
    return;
  }

  if (action === 'alias') {
    const teamName = context;
    const alias = id;
    await writeTeamAlias(teamName, alias);
    return;
  }

  if (action === 'config') {
    context = argv._[0];
    action = argv._[1];
  }

  let handler = handlers[context][action];
  if (typeof handler === 'function') {
    handler = {
      action: handler,
      formatters: {
        json: formatters.json[context],
        console: formatters.console[context]
      }
    };
  }

  try {
    const output = await handler.action(argv);
    handler.formatters[argv.output](output, argv);
  } catch (error) {
    formatters[argv.output].error({ error, context, action, id });
  }
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
