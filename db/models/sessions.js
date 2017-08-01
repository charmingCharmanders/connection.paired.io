const db = require('../');

const Session = db.Model.extend({
  tableName: 'sessions',
  profile1: function() {
    return this.belongsTo('Profile', 'profileId1');
  },
  profile2: function() {
    return this.belongsTo('Profile', 'profileId2');
  },
  prompt: function() {
    return this.belongsTo('Prompt', 'promptId');
  },
});

module.exports = db.model('Session', Session);
