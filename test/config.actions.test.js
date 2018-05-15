const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const context = 'jira.yourteam.com';
const username = 'narf';
const password = 'larf';
const points = 'customfield_1';

function stubbedActions(stubs) {
  const makeGetRequest = () => { return [{ id: points, name: 'Story Points' }]; };
  const configActions = proxyquire('../src/config.actions', {
    './jira-client': {
      makeGetRequest: stubs.makeGetRequest || makeGetRequest,
      getSessionCookie: () => {}
    },
    './config': {
      addContext: stubs.addContext || (() => {}),
      addPoints: () => { return { points }; },
      getCurrentContext: stubs.getCurrentContext || (() => { return false; }),
      setCurrentContext: stubs.setCurrentContext || (() => {})
    }
  });
  return configActions;
}

describe('src.config.actions', () => {

  describe('.set-context', () => {
    it('adds and sets the current context', async () => {
      const addContext = sinon.spy();
      const setCurrentContext = sinon.spy();
      const result = await stubbedActions({
        addContext,
        setCurrentContext })['set-context']({ id: context, password, username });
      let error;
      expect(addContext.calledOnce).to.be.true;
      expect(setCurrentContext.calledOnce).to.be.true;
      expect(result).to.eql({ context, defaultContext: context, error, password, points, username });
    });

    it('doesn\'t set the current context if it\'s already set', async () => {
      const addContext = sinon.spy();
      const getCurrentContext = () => { return true; };
      const setCurrentContext = sinon.spy();
      const result = await stubbedActions({
        addContext,
        getCurrentContext,
        setCurrentContext })['set-context']({ id: context, password, username });
      let error;
      let defaultContext;
      expect(addContext.calledOnce).to.be.true;
      expect(setCurrentContext.called).to.be.false;
      expect(result).to.eql({ context, defaultContext, error, password, points, username });
    });

    it('sets points to undefined if the points field is missing', async () => {
      const makeGetRequest = () => { return; };
      const result = await stubbedActions({ makeGetRequest })['set-context']({ id: context, password, username });
      expect(result.points).to.be.undefined;
    });
  });

  describe('.getEstimator', () => {
    it('returns the points field when one is configured', async () => {
      const result = await stubbedActions({}).getEstimator();
      let error;
      expect(result).to.eql({ points, error });
    });

    it('catches errors when makeGetRequest returns no results', async () => {
      const makeGetRequest = () => { return; };
      const result = await stubbedActions({ makeGetRequest }).getEstimator();
      expect(result.error.toString()).to.equal('TypeError: Cannot read property \'filter\' of undefined');
    });
  });
});
