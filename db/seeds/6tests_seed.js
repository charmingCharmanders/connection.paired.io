
const models = require('../models');

exports.seed = function (knex, Promise) {
  return models.Test.where({ description: 'multiplies two positive integers' }).fetch()
    .then((tests) => {
      if (tests) {
        throw tests;
      }
      return models.Test.forge({
        promptId: 1,
        description: 'multiplies two positive integers',
        arguments: '2, 3'
      }).save();
    })
    .error(err => {
      console.error('ERROR: failed to create test');
      throw err;
    })
    .catch(() => {
      console.log('WARNING: default test already exists.');
    });
};



