/* eslint-disable no-sync */
const mkdirp = require('mkdirp');
const os = require('os');
const path = require('path');
const fs = require('fs');
const keytar = require('keytar');

const configDir = path.join(os.homedir(), '.jiractl');
const configFilePath = path.join(configDir, 'config.json');
const initialConfig = {
  contexts: {}
};

function ensureConfig() {
  mkdirp.sync(configDir);
  if (!fs.existsSync(configFilePath)) {
    saveConfig(initialConfig);
  }
}

function loadConfig() {
  ensureConfig();
  const config = require(configFilePath);

  for (const context in config.contexts) {
    if (Object.prototype.hasOwnProperty.call(config.contexts, context)) {
      if (!config.contexts[context].password) {
        const password = keytar.getPassword('jiractl', context);
        config.contexts[context].password = password;
      }
    }
  }

  return config;
}

function saveConfig(config) {
  for (const context in config.contexts) {
    if (Object.prototype.hasOwnProperty.call(config.contexts, context)) {
      const password = config.contexts[context].password;
      keytar.setPassword('jiractl', context, password);
      delete context.password;
    }
  }

  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
}

function addContext({ context, username, password }) {
  const config = loadConfig();
  config.contexts[context] = {
    uri: context,
    username,
    password
  };
  saveConfig(config);
}

function setCurrentContext(context) {
  const config = loadConfig();
  if (!config.contexts[context]) {
    return new Error(`Invalid context "${context}" specified.`);
  }

  config.currentContext = context;
  saveConfig(config);
}

function getCurrentContext() {
  const config = loadConfig();
  return config.contexts[config.currentContext];
}

function addPoints({ context, points }) {
  const config = loadConfig();
  config.contexts[context].points = points;
  saveConfig(config);
}

module.exports = {
  addContext,
  addPoints,
  ensureConfig,
  getCurrentContext,
  loadConfig,
  saveConfig,
  setCurrentContext
};
