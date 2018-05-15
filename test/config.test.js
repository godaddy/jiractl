const { expect } = require('chai');
const { promisify } = require('util');
const rewire = require('rewire');
const sinon = require('sinon');
const tmp = require('tmp');

const config = rewire('../src/config');
const context = 'https://jira.com';
const username = 'narf';
const password = 'larf';
const points = 'customfield_1';
const testConfig = {
  contexts: {
    [context]: {
      uri: context,
      username,
      password
    }
  }
};

describe('src.config', () => {
  beforeEach(async () => {
    const file = promisify(tmp.file);
    const configFile = await file({ postfix: '.json' });
    config.__set__({
      configDir: '/tmp',
      configFilePath: configFile
    });
  });

  describe('.addContext', () => {
    it('adds a context', () => {
      config.saveConfig({ contexts: {}});
      config.addContext({ context, username, password });
      expect(config.loadConfig()).to.eql(testConfig);
    });
  });

  describe('.addPoints', () => {
    it('adds a points field to the specified context', () => {
      config.saveConfig(testConfig);
      const expected = {
        contexts: {
	  [context]: {
            uri: context,
            username,
            password,
            points
          }
        }
      };
      expect(config.loadConfig()).to.eql(testConfig);
      config.addPoints({ context, points });
      expect(config.loadConfig()).to.eql(expected);
    });
  });

  describe('.getCurrentContext', () => {
    it('returns the current context', () => {
      config.saveConfig(testConfig);
      config.setCurrentContext(context);
      expect(config.getCurrentContext()).to.eql({ uri: context, username, password });
    });
  });

  describe('.ensureConfig', () => {
    it('saves an initial config if one doesn\'t exist', () => {
      const saveConfig = sinon.spy();
      config.__set__({
        configDir: '/tmp',
        configFilePath: 'fake_file',
        saveConfig
      });
      config.ensureConfig();
      expect(saveConfig.calledOnce).to.be.true;
      expect(saveConfig.calledWithExactly({ contexts: {}})).to.be.true;
    });

    it('doesn\'t save an initial config if a config already exists', () => {
      const saveConfig = sinon.spy();
      config.__set__({
        saveConfig
      });
      config.ensureConfig();
      expect(saveConfig.called).to.be.false;
    });
  });

  describe('.loadConfig', () => {
    it('calls ensureConfig and loads che config file', () => {
      const initialConfig = { contexts: {}};
      config.saveConfig(initialConfig);
      const ensureConfig = sinon.spy();
      config.__set__({
        ensureConfig
      });
      const result = config.loadConfig();
      expect(ensureConfig.calledOnce).to.be.true;
      expect(result).to.eql(initialConfig);
    });
  });
});
