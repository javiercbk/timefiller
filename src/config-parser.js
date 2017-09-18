const fs = require('fs');

class ConfigParser {
  constructor(file) {
    this.file = file;
  }

  readConfigSync() {
    let stats;
    try {
      stats = fs.statSync(this.file);
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error('Config file path does not exist');
      }
    }
    if (stats.isDirectory()) {
      throw new Error('Config file path is a directory');
    }
    return this._readJSONSync();
  }

  _readJSONSync() {
    return JSON.parse(fs.readFileSync(this.file, 'utf8'));
  }
}

module.exports = ConfigParser;
