
module.exports = class Paginator {
  constructor({ fetchPage, processResults }) {
    // Fetch & handle results of any entity (e.g. Epic, Story, etc.)
    this.fetchPage = fetchPage;
    this.processResults = processResults;
  }

  async nextPage(startAt, acc) {
    const { fetchPage, processResults } = this;
    const result = await fetchPage({ startAt });

    acc.push(...processResults(result));

    return result;
  }

  async fetchAll() {
    let isLast = false;
    let startAt = 0;
    const values = [];

    while (!isLast) {
      const result = await this.nextPage(startAt, values);

      startAt += result.values.length;
      isLast = result.isLast;
    }

    return values;
  }
};
