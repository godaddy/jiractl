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
      expect(addContext.calledOnce).to.be.true;
      expect(setCurrentContext.calledOnce).to.be.true;
      expect(result).to.eql({ context, defaultContext: context, password, points, username });
    });

    it('doesn\'t set the current context if it\'s already set', async () => {
      const addContext = sinon.spy();
      const getCurrentContext = () => { return true; };
      const setCurrentContext = sinon.spy();
      const result = await stubbedActions({
        addContext,
        getCurrentContext,
        setCurrentContext })['set-context']({ id: context, password, username });
      let defaultContext;
      expect(addContext.calledOnce).to.be.true;
      expect(setCurrentContext.called).to.be.false;
      expect(result).to.eql({ context, defaultContext, password, points, username });
    });

    it('throws an error when the points field is missing', async () => {
      const makeGetRequest = () => { return []; };
      let error;
      try {
        await stubbedActions({ makeGetRequest })['set-context']({ id: context, password, username });
      } catch (err) {
	  error = err;
      }
      expect(error.message).to.equal('No points field configured');
    });
  });

  describe('.getEstimator', () => {
    it('returns the points field when one is configured', async () => {
      const result = await stubbedActions({}).getEstimator();
      expect(result).to.eql(points);
    });

    it('throws an error when makeGetRequest returns no results', async () => {
      const makeGetRequest = () => { return; };
      let error;
      try {
        await stubbedActions({ makeGetRequest }).getEstimator();
      } catch (err) {
        error = err;
      }
      expect(error.message).to.equal('Cannot read property \'filter\' of undefined');
    });

    it('throws an error when no points field is configured', async () => {
      const makeGetRequest = () => { return []; };
      let error;
      try {
        await stubbedActions({ makeGetRequest }).getEstimator();
      } catch (err) {
        error = err;
      }
      expect(error.message).to.equal('No points field configured');
    });

  });
});
