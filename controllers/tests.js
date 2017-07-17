const models = require('../db/models');

module.exports.getAll = (req, res) => {
  models.Test.fetchAll()
    .then(tests => {
      res.status(200).send(tests);
    })
    .catch(err => {
      // This code indicates an outside service (the database) did not respond in time
      res.status(503).send(err);
    });
};

// module.exports.getOne = (req, res) => {
//   models.User.where({ id: req.params.id }).fetch()
//     .then(user => {
//       if (!user) {
//         throw user;
//       }
//       res.status(200).send(user);
//     })
//     .error(err => {
//       res.status(500).send(err);
//     })
//     .catch(() => {
//       res.sendStatus(404);
//     });
// };
