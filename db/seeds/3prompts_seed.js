
const models = require('../models');

exports.seed = function (knex, Promise) {
  return models.Prompt.where({ name: 'rock, paper, scissors' }).fetch()
    .then((prompt) => {
      if (prompt) {
        throw prompt;
      }
      return models.Prompt.forge({
        name: 'rock, paper, scissors',
        description: 'rock, paper, scissors description goes here',
        category: 'recursion',
        solutionCode: 'admin solution code goes here'
      }).save();
    })
    .error(err => {
      console.error('ERROR: failed to create prompt');
      throw err;
    })
    .catch(() => {
      console.log('WARNING: default prompt already exists.');
    });
};


