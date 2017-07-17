
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTableIfNotExists('sessions', function (table) {
      table.increments('id').unsigned().primary();
      table.integer('userId1').unsigned();
      table.foreign('userId1').references('id').inTable('users');
      table.integer('userId2').unsigned();
      table.foreign('userId2').references('id').inTable('users');
      table.integer('promptId').unsigned();
      table.foreign('promptId').references('id').inTable('prompts');
      table.string('skeletonCode').nullable();
      table.string('solutionCode').nullable();
      table.dateTime('startedAt').nullable();
      table.dateTime('endedAt').nullable();
    })
  ]);
};
exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('sessions')
  ]);
};
