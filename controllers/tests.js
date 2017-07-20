const models = require('../db/models');

module.exports.getAll = () => {
  models.Test.fetchAll()
    .then(tests => {
      return tests;
    })
    .catch(err => {
      return err;
    });
};

module.exports.getAllByPromptId = (promptId) => {
  models.Test
    .where({ promptId: promptId })
    .fetchAll()
    .then(tests => {
      if (!tests) {
        throw tests;
      }
      return tests;
    })
    .error(err => {
      return err;
    });
};
