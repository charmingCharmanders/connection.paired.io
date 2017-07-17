const db = require('../');

const Prompt = db.Model.extend({
  tableName: 'prompts',
  session: function() {
    return this.hasOne('Session');
  },
  test: function() {
    return this.hasOne('Test');
  }
});

module.exports = db.model('Prompt', Prompt);
