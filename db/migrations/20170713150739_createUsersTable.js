exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('users', function (table) {
      table.increments('id').unsigned().primary();
      table.string('firstName');
      table.string('lastName');
      table.string('rating').nullable();
      table.string('emailAddress').unique();
      table.timestamps(true, true);
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('users')
  ]);
};
