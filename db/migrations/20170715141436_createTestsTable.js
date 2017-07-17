
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('tests', function (table) {
      table.increments('id').unsigned().primary();
      table.integer('promptId').unsigned();
      table.foreign('promptId').references('id').inTable('prompts');
      table.string('description');
      table.string('arguments');
      table.string('expectedOutput');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('tests')
  ]);
};
