const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const { columnDelimiter } = require('../src/formatters/table');

function editEpic(args, dependencies) {
  const epicActions = proxyquire('../src/epic.actions', {
    './edit-contents': dependencies.editContents,
    './jira-client': {
      makeQuery: null,
      makeGetRequest: dependencies.makeGetRequest,
      makePutRequest: dependencies.makePutRequest
    }
  });
  return epicActions.edit.action(args);
}

describe('src.epicActions', () => {
  describe('.edit', () => {
    it('does not try to update order if order has not changed', async () => {
      const id = 'FOO-123';
      const editContents = () => {
        return `foo-key${ columnDelimiter }foo-status${ columnDelimiter }foo-summary`;
      };
      const makeGetRequest = async () => ({
        issues: [{
          key: 'foo-key',
          fields: {
            status: {
              name: 'foo-status'
            },
            summary: 'foo-summary'
          }
        }]
      });
      const res = await editEpic({ id }, { editContents, makeGetRequest });
      expect(res.message).to.equal(`No updates to Epic ${ id }`);
    });

    it('updates issue order', async () => {
      const id = 'FOO-123';
      const editContents = () => {
        return [`goo-key${ columnDelimiter }goo-status${ columnDelimiter }goo-summary`,
          `foo-key${ columnDelimiter }foo-status${ columnDelimiter }foo-summary`].join('\n');
      };
      const issueResponse = {
        issues: [{
          key: 'foo-key',
          fields: {
            status: {
              name: 'foo-status'
            },
            summary: 'foo-summary'
          }
        }, {
          key: 'goo-key',
          fields: {
            status: {
              name: 'goo-status'
            },
            summary: 'goo-summary'
          }
        }]
      };
      const makeGetRequest = async () => { return issueResponse; };
      const makePutRequest = sinon.spy(async (api, version, rankDatum) => {
        expect(rankDatum.issues).has.length(1);
        if (rankDatum.issues[0] === 'goo-key') {
          expect(rankDatum.rankBeforeIssue).is.equal('foo-key');
        } else if (rankDatum.issues[0] === 'foo-key') {
          expect(rankDatum.rankAfterIssue).is.equal('goo-key');
        } else {
          expect(`Should not reach: ${ rankDatum }`).to.be.false;
        }
      });
      const res = await editEpic({ id }, { editContents, makeGetRequest, makePutRequest });
      expect(makePutRequest.calledTwice).to.be.true;
      expect(res.message).to.equal(`Updated Epic ${ id }`);
    });
  });
});
