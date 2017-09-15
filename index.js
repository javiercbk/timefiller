const executeClient = require('./src/cli');

executeClient(__dirname).then(() => {
  process.exit(0);
}).catch((err) => {
  console.log(err);
  process.exit(-1);
});
