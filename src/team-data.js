/* eslint-disable no-sync */
const fs = require('fs');
const path = require('path');
const { getTeams } = require('./teams.actions');
const { makeGetRequest } = require('./jira-client');

const orderFilters = /ORDER BY createdDate DESC|ORDER BY Rank ASC|ORDER BY Rank/gi;
const mapPath = path.join(__dirname, '../.jiractl-team-map.json');

async function getBoardDetails(boardId) {
  return await makeGetRequest(`rapidviewconfig/editmodel.json?rapidViewId=${ boardId }`, 'greenhopper/1.0');
}

async function writeTeamsData(id) {
  const teams = await getTeams({ id });
  const detailsPromises = teams.map(async team => {
    const boardData = await getBoardDetails(team.id);
    // Remove any `order by rank` filters, since a different order filter will be applied when fetching epics.
    const epicFilter = (boardData ? boardData.filterConfig.query : '').replace(orderFilters, '');
    return {
      board: team.id,
      name: team.name,
      epicFilter
    };
  });
  const teamDetails = await Promise.all(detailsPromises);
  let config = {};
  try {
    config = JSON.parse(fs.readFileSync(mapPath).toString());
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
  teamDetails.forEach(team => {
    config[team.name] = { ...team };
  });
  fs.writeFileSync(mapPath, JSON.stringify(config, null, 2));
  console.log(`Updated team-map with teams: ${ // eslint-disable-line no-console
    teamDetails.map(team => team.name).join(', ') }`);
}

function writeTeamAlias(teamName, alias) {
  const config = JSON.parse(fs.readFileSync(mapPath).toString());
  const teamData = Object.assign({}, config[teamName]);
  config[alias] = teamData;
  fs.writeFileSync(mapPath, JSON.stringify(config, null, 2));
  console.log(`Aliased ${ teamName } with ${ alias }:\n`, teamData); // eslint-disable-line no-console
}

function loadTeamMap() {
  try {
    return JSON.parse(fs.readFileSync(mapPath).toString());
  } catch (err) {
    return {};
  }
}

function getTeamId(teamName, teamMap = loadTeamMap()) {
  const team = teamMap[teamName];
  return (team && team.board) ? team.board : teamName;
}

function getTeamComponent(teamName) {
  return loadTeamMap()[teamName].epicFilter;
}

module.exports = {
  getTeamComponent,
  getTeamId,
  writeTeamsData,
  writeTeamAlias
};
