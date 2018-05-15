const formatters = require('./formatters/issues');
const client = require('./jira-client');
const config = require('./config');
const missingField = '-';

async function getIssue(issueId) {
  return await client.makeGetRequest(`issue/${ issueId }`);
}

function formatSprintDetails(sprint, outputSprintId) {
  return outputSprintId ? `${sprint.id} - ${sprint.name}` : sprint.name;
}

function getSprintDetails(fields, outputSprintId) {
  const sprints = [fields.sprint, ...(fields.closedSprints || [])].filter(sprint => !!sprint);
  return sprints.length ? sprints.map(sprint => formatSprintDetails(sprint, outputSprintId)).join(', ') : missingField;
}

function getIssueAssignee(fields) {
  return fields.assignee ? fields.assignee.key : missingField;
}

function getEpic(fields, outputSummary) {
  if (fields.epic) {
    return outputSummary ? `${fields.epic.key} - ${fields.epic.summary}` : fields.epic.key;
  }
  return missingField;
}

async function describe({ id }) {
  const issue = await getIssue(id);
  const fields = issue.fields;
  const points = config.getCurrentContext().points;
  const issueDescription = {
    summary: fields.summary,
    description: fields.description,
    status: fields.status.name,
    creator: fields.creator.key,
    priority: fields.priority.name,
    epic: getEpic(fields, true),
    sprint: getSprintDetails(fields, true),
    type: fields.issuetype.name,
    assignee: getIssueAssignee(fields),
    id: issue.id,
    key: issue.key,
    points: fields[points]
  };
  return issueDescription;
}

async function get({ id }) {
  const issue = await getIssue(id);
  const fields = issue.fields;
  const points = config.getCurrentContext().points;

  return {
    summary: fields.summary,
    status: fields.status.name,
    epic: getEpic(fields),
    sprint: getSprintDetails(fields),
    assignee: getIssueAssignee(fields),
    key: issue.key,
    points: fields[points]
  };
}

const bulkUpdateFields = ['summary', 'points'];
const supportedUpdateFields = bulkUpdateFields.concat(['assignee']);

async function update(args) {
  const id = args.id;

  // To see keys that can be updated:
  // await makeGetRequest(`issue/${ id }/editmeta`, api='api/2');
  if (!Object.keys(args).some(key => supportedUpdateFields.includes(key))) {
    return {
      error: `Editable fields are ${ supportedUpdateFields.join(', ') }`
    };
  }

  let outputData = {};
  if (args.assignee) {
    await updateAssignee({ id, assignee: args.assignee });
    outputData.assignee = args.assignee;
  }

  const updateData = {};
  Object.keys(args).forEach(arg => {
    if (bulkUpdateFields.includes(arg)) {
      updateData[arg] = args[arg];
    }
  });

  outputData = Object.assign(outputData, updateData);
  if (typeof updateData.points !== 'undefined') {
    updateData[config.getCurrentContext().points] = updateData.points;
    delete updateData.points;
  }

  await client.makePutRequest(`issue/${ id }`, 'api/2', { fields: updateData });

  return outputData;
}

async function updateAssignee({ id, assignee }) {
  return await client.makePutRequest(`issue/${ id }/assignee`, 'api/2', { name: assignee });
}

module.exports = {
  create: () => {},
  describe: {
    action: describe,
    formatters: {
      console: formatters.console.describe,
      json: formatters.json.default
    }
  },
  get: {
    action: get,
    formatters: {
      console: formatters.console.get,
      json: formatters.json.default
    }
  },
  update: {
    action: update,
    formatters: {
      console: formatters.console.update,
      json: formatters.json.default
    }
  },
  getIssue
};
