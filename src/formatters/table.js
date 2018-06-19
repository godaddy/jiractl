const Table = require('cli-table3');

const columnDelimiter = '\t';

const tableOptions = {
  chars: {
    'top': '',
    'top-mid': '',
    'top-left': '',
    'top-right': '',
    'bottom': '',
    'bottom-mid': '',
    'bottom-left': '',
    'bottom-right': '',
    'left': '',
    'left-mid': '',
    'mid': '',
    'mid-mid': '',
    'right': '',
    'right-mid': '',
    'middle': columnDelimiter
  },
  style: {
    'padding-left': 0,
    'padding-right': 0,
    'head': [],
    'border': []
  }
};

function getLengthPerColumn(rows = []) {
  const maxLengths = rows.reduce((lengths, item) => {
    const entries = Object.entries(item);
    entries.forEach(e => {
      if (!!e[1] && (!lengths[e[0]] || lengths[e[0]] < e[1].toString().length)) {
        lengths[e[0]] = e[1].toString().length;
      }
    });

    return lengths;
  }, {});
  Object.keys(maxLengths).forEach(header => {
    if (header.toString().length > maxLengths[header]) {
      maxLengths[header] = header.toString().length;
    }
  });
  return maxLengths;
}

function formatHeader(rows) {
  const columns = getLengthPerColumn(rows);
  const table = new Table(Object.assign({
    head: Object.keys(columns).map(col => col.toUpperCase()),
    colWidths: Object.values(columns)
  }, tableOptions));
  return table.toString();
}

function formatBody(rows) {
  const columns = getLengthPerColumn(rows);
  const table = new Table(Object.assign({
    colWidths: Object.values(columns)
  }, tableOptions));
  rows.forEach(item => table.push(Object.values(item)));
  return table.toString();
}

/**
 * Format an array of rows into a CLI table.
 *
 * @example
 * formatTable([{name: 'Bagels', color: 'orange'}, {name: 'Little', color: 'black'}]);
 *
 * @param {Array} rows - Objects mapping column name to value.
 * @returns {String} Representation of the CLI table.
 */
function formatTable(rows) {
  return `${ formatHeader(rows) }\n${ formatBody(rows)}`;
}

/**
 * The inverse of `formatBody`: parse a string into rows and columns.
 *
 * @param {String} body - Table body.
 * @returns {Array} Array of rows, each row is represented by an array of column values.
 */
function parseBody(body) {
  return body
    .split('\n')
    .filter(line => !line.startsWith('#'))
    .map(line => line.split(columnDelimiter))
    .map(values => {
      return values
        .map(value => value.trim())
        .filter(value => value);
    })
    .filter(values => values.length);
}

module.exports = {
  columnDelimiter,
  formatHeader,
  formatBody,
  formatTable,
  parseBody
};
