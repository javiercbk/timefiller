const program = require('commander');
const path = require('path');

const TimeFiller = require('./timefiller');
const timeUtils = require('./time-utils');
const ConfigParser = require('./config-parser');

const executeClient = function (dirname) {
  program
    .version('0.0.1')
    .option('-f, --file', 'Configuration file path')
    .parse(process.argv);


  let configFilePath = path.join(dirname, 'timefiller.json');
  if (program.file) {
    configFilePath = program.file;
  } else {
    console.log('No file given, assuming \'timefiller.json\'');
  }

  const configParser = new ConfigParser(configFilePath);
  let config;
  try {
    config = configParser.readConfigSync();
  } catch (configError) {
    const message = configError.message || configError;
    if (message === 'Config file path does not exist') {
      console.log(`Config file "${configFilePath}" does not exist`);
    } else if (message === 'Config file path is a directory') {
      console.log(`Config file "${configFilePath}" is a directory`);
    } else {
      console.log(`Error parsing config file "${configFilePath}": ${message}`);
    }
    throw configError;
  }
  try {
    const timeFiller = new TimeFiller(config, dirname);
    const lastWorkDay = timeUtils.lastWorkDate();
    return timeFiller.syncTimes(lastWorkDay);
  } catch (timeFillerError) {
    const message = timeFillerError.message || timeFillerError;
    console.log(`Error executing timefiller ${message}`);
    throw timeFillerError;
  }
};

module.exports = executeClient;
