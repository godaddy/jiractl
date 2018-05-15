const { getCurrentContext } = require('./config');

function reduceStoryPoints(total, story) {
  const points = getCurrentContext().points;
  return total + (story.fields[points] || 0);
}

function getCompletedPoints(stories) {
  return stories
    .filter(story => story.fields.status.name === 'Closed' || story.fields.status.name === 'Completed')
    .reduce(reduceStoryPoints, 0);
}

function getTotalPoints(stories) {
  return stories.reduce(reduceStoryPoints, 0);
}

module.exports = {
  getCompletedPoints,
  getTotalPoints
};
