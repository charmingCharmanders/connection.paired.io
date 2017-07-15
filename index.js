'use strict';
const app = require('./app.js');
const PORT = process.env.port || 3001;

app.listen(PORT, () => {
  console.log('Example app listening on port 3001!');
});
