const { expect } = require('chai');
const teamData = require('../src/team-data');

describe('src.team-data', () => {
  describe('getTeamId', () => {
    const { getTeamId } = teamData;

    it('should map teamId against teamMap', () => {
      const teamMap = { foo: { board: 2456 } };

      const teamId = getTeamId('foo', teamMap);
      expect(teamId).to.equal(2456);
    });

    it('should return teamId if there is no entry in team-map', () => {
      const teamMap = {};

      const teamId = getTeamId('foo', teamMap);
      expect(teamId).to.equal('foo');
    });
  });
});
