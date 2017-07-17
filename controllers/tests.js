const models = require('../db/models');

module.exports.getAll = () => {
  models.Test.fetchAll()
    .then(tests => {
      return tests;
    })
    .catch(err => {
      // This code indicates an outside service (the database) did not respond in time
      return err;
    });
};


module.exports.getAllByPromptId = (prompt_id) => {
  // console.log(req.params.prompt_id);
  models.Test.where({ promptId: prompt_id }).fetchAll()
    .then(test => {
      if (!test) {
        throw test;
      }
      return test;
    })
    .error(err => {
      return err;
    })
};
