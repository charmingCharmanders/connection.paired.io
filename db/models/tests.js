const db = require('../');

const Test = db.Model.extend({
  tableName: 'tests',
  prompt: function() {
    return this.belongsTo('Prompt');
  }
});

module.exports = db.model('Test', Test);
