const { expect } = require('chai');

const { columnDelimiter, formatHeader, formatBody, formatTable, parseBody } = require('../../src/formatters/table');

const testRows = [
  { name: 'Bagels', color: 'orange' },
  { name: 'Little', color: 'black' }
];

describe('src.formatters', () => {
  describe('.table', () => {
    describe('.formatHeader', () => {
      it('returns a single row', () => {
        const headers = formatHeader(testRows);
        expect(headers.split('\n')).has.length(1);
      });
    });
    describe('.formatBody', () => {
      it('returns expected number of rows', () => {
        const body = formatBody(testRows);
        expect(body.split('\n')).has.length(testRows.length);
      });
    });
    describe('.formatTable', () => {
      it('returns expected number of rows', () => {
        const table = formatTable(testRows);
        expect(table.split('\n')).has.length(testRows.length + 1);
      });
    });
    describe('.parseBody', () => {
      it('returns expected rows', () => {
        const body = `0,0${ columnDelimiter }0,1\n1,0${ columnDelimiter }1,1`;
        const rows = parseBody(body);
        expect(rows).to.deep.equal([
          ['0,0', '0,1'],
          ['1,0', '1,1']
        ]);
      });
      it('ignores comments', () => {
        const body = `0,0${ columnDelimiter }0,1\n# comment\n1,0${ columnDelimiter }1,1\n# comment`;
        const rows = parseBody(body);
        expect(rows).to.deep.equal([
          ['0,0', '0,1'],
          ['1,0', '1,1']
        ]);
      });
      it('ignores blank comments', () => {
        const body = `0,0${ columnDelimiter }0,1\n       ${ columnDelimiter }     \n1,0${ columnDelimiter }1,1`;
        const rows = parseBody(body);
        expect(rows).to.deep.equal([
          ['0,0', '0,1'],
          ['1,0', '1,1']
        ]);
      });
    });
  });
});
