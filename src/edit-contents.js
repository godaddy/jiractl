/* eslint-disable no-sync */
const editor = require('editor2');
const fs = require('fs');
const tmp = require('tmp');

async function editContents({ content, prefix = 'jiractl-', postfix = '.txt' }) {
  const tmpobj = tmp.fileSync({ prefix, postfix });
  try {
    fs.writeFileSync(tmpobj.name, content);
    await editor(tmpobj.name);
    const res = fs.readFileSync(tmpobj.name).toString();
    tmpobj.removeCallback();
    return res;
  } catch (err) {
    tmpobj.removeCallback();
    throw err;
  }
}

module.exports = editContents;
