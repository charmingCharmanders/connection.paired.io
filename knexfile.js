const config = require('config');

if (process.env.DATABASE_URL) {
  module.exports = {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 1,
      max: 2
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: 'db/migrations'
    },
    seeds: {
      directory: 'db/seeds'
    },
    ssl: true
  };

} else {
  module.exports = config['knex'];
}
