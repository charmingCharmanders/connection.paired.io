
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('friends', function (table) {
      table.increments('id').unsigned().primary();
      table.integer('userId1').unsigned();
      table.foreign('userId1').references('id').inTable('users');
      table.integer('userId2').unsigned();
      table.foreign('userId2').references('id').inTable('users');
      table.unique(['userId1', 'userId2']);
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('friends')
  ]);
};
