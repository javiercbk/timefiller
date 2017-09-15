const program = require('commander');
const path = require('path');
const moment = require('moment');

const TimeFiller = require('./timefiller');

const executeClient = function (dirname) {
  const ConfigParser = require('./config-parser');

  program
  .version('0.0.1')
  .option('-f, --file', 'Configuration file path')
  .parse(process.argv);


  let configFilePath = path.join(dirname, 'timefiller.json');
  if (program.file) {
    configFilePath = program.file;
  } else {
    console.log('No file given, assuming \'timefiller.json\'')
  }

  const configParser = new ConfigParser(configFilePath);
  let config;
  try {
    config = configParser.readConfigSync();
  } catch(configError) {
    const message = configError.message || configError;
    if (message === 'Config file path does not exist') {
      console.log(`Config file "${configFilePath}" does not exist`);
    } else  if (message === 'Config file path is a directory') {
      console.log(`Config file "${configFilePath}" is a directory`);
    } else {
      console.log(`Error parsing config file "${configFilePath}": ${message}`);
    }
    throw configError;
  }
  try {
    const timeFiller = new TimeFiller(config, dirname);
    const yesterday = moment().add(-1, 'day');
    return timeFiller.syncTimes(yesterday);
  } catch(timeFillerError) {
    const message = timeFillerError.message || timeFillerError;
    console.log(`Error executing timefiller ${message}`);
    throw timeFillerError;
  }
};

module.exports = executeClient;
