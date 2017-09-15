const Promise = require('bluebird');
const prompt = require('prompt');

class CliPrompt {
  constructor() {
    prompt.start();
  }

  ask(toAsk) {
    return this.askWithSchema('answer', toAsk);
  }

  askWithSchema(schema, toAsk) {
    console.log(toAsk.question);
    if (toAsk.options) {
      toAsk.options.forEach((option) => {
        console.log(option);
      });
    }
    return new Promise((resolve, reject) => {
      prompt.get(schema, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}

const cliPromptInstance = new CliPrompt();

module.exports = cliPromptInstance;
