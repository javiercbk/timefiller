const _ = require('lodash');
const moment = require('moment');

const cliPrompt = require('./cli-prompt');
const HarvestFacade = require('./harvest-facade');
const JiraFacade = require('./jira-facade');
const WakaFacade = require('./waka-facade');

const secondsToHours = seconds => Math.round(seconds / 60 / 60);
const hoursToSeconds = hours => Math.round(hours * 60 * 60);

class TimeFiller {
  constructor(config) {
    if (config.harvest) {
      this.harvestFacade = new HarvestFacade(config);
    }
    if (config.jira) {
      this.jiraFacade = new JiraFacade(config);
    }
    this.wakaFacade = new WakaFacade(config);
  }

  syncTimes(date) {
    let stats;
    return this.wakaStats(date)
      .catch(() => {
        console.log('Waka time failed miserably :(');
        return {
          date,
          seconds: 0,
        };
      })
      .then((wakaStats) => {
        stats = wakaStats;
        // sprinkle some magic
        const realSeconds =
          this._magicSecretAndEsotericHeuristicalTimeConversion(wakaStats.seconds);
        stats.seconds = realSeconds;
        const realHours = secondsToHours(realSeconds);
        return cliPrompt.askWithSchema({
          properties: {
            answer: {
              pattern: /^[0-9.]+$/,
              message: 'Please type a number or empty',
              required: false,
            },
          },
        }, {
          question: `According to my magical calculation, you worked aproximatelly ${realHours} hours. Type enter to confirm or a new number to correct.`,
        }).then((result) => {
          const newHours = parseFloat(result.answer);
          if (!Number.isNaN(newHours)) {
            const oldHours = secondsToHours(stats.seconds);
            console.log(`Changing from ${oldHours} hours to ${newHours} hours.`);
            stats.seconds = hoursToSeconds(newHours);
          }
        });
      })
      .then(() => {
        if (this.jiraFacade) {
          return this.syncWithJira(stats);
        }
      })
      .then(() => {
        if (this.harvestFacade) {
          return this.syncWithHarvest(stats);
        }
      })
      .catch((err) => {
        let errorType;
        switch (err.timefillerErrorType) {
          case 'waka':
            errorType = 'Waka time error';
            break;
          case 'jira':
            errorType = 'JIRA error';
            break;
          case 'harvest':
            errorType = 'Harvest error';
            break;
          default:
            errorType = 'Unknown error';
            break;
        }
        const message = err.message || err;
        console.log(`${errorType}: ${message}`);
        throw err;
      });
  }

  wakaStats(date) {
    return this.wakaFacade.dayWorkSeconds(date);
  }

  syncWithJira(worked) {
    return this.jiraFacade.retrievedWorkLogged(worked.date)
      .then((results) => {
        if (results && results.length) {
          return results[0];
        }
      })
      .then((issueWorkLogged) => {
        if (issueWorkLogged) {
          return cliPrompt.askWithSchema({
            properties: {
              answer: {
                pattern: /^[yn]$/,
                message: 'Yes or no?',
                required: true,
              },
            },
          }, {
            question: `A work log was already submited to "${issueWorkLogged.key}" with that date, would you like to create a new one? [y/n]`,
          }).then(result => result.answer === 'y');
        }
        return true;
      })
      .then((shouldProceed) => {
        if (shouldProceed) {
          return this._chooseIssueAndAssign(worked);
        }
      });
  }

  syncWithHarvest(worked) {
    const date = worked.date.toDate();
    return this.harvestFacade.retrieveWorkedHours(date)
      .then((response) => {
        // should choose projects
        const dayEntries = _.get(response, 'body.day_entries');
        if (dayEntries && dayEntries.length) {
          console.log('Time has already been filled in harvest');
          return false;
        }
        const projectId = _.get(response, 'body.projects[0].id');
        // if there are more than 1 billable task, it should let you choose.
        const task = _.get(response, 'body.projects[0].tasks', []).find(t => t.billable);
        const realHours = secondsToHours(worked.seconds);
        return this.harvestFacade.createWorkedHours(projectId, task.id, date, realHours);
      }).then((response) => {
        if (response) {
          console.log('Successfully saved hours to harvest');
        }
      });
  }

  _chooseIssueAndAssign(worked) {
    if (!worked.seconds) {
      console.log('No work log found in waka time');
    } else {
      return this._chooseJiraIssue()
        .then((ticketToAssign) => {
          const truncatedDate = worked.date.startOf('day');
          const existingWorklog = ticketToAssign.fields.worklog.worklogs.find((w) => {
            const worklogDate = moment(w.started).startOf('day');
            return truncatedDate.isSame(worklogDate);
          });
          if (existingWorklog) {
            console.log(`Jira issue ${ticketToAssign.key} has already a worklog for ${truncatedDate.format('YYYY-MM-DD')}`);
          } else {
            // sprinkle some magic
            return this.jiraFacade.addWorklog(ticketToAssign.id, worked.date, worked.seconds);
          }
        }).then(() => {
          console.log('Successfully saved worklog to JIRA');
        });
    }
  }

  _chooseJiraIssue() {
    let issueChosen;
    return this.jiraFacade.assignableIssues('LMS', ['DEV-IN-PROGRESS', 'DEV-DONE'])
      .then((issues) => {
        if (issues.length) {
          let sampleTickets = '';
          issues.forEach((i) => {
            // eslint-disable-next-line no-useless-concat
            sampleTickets += `${i.key}: "${i.fields.summary}"` + '\n';
          });
          let question = 'Type the ticket name to assign hours';
          if (sampleTickets) {
            // eslint-disable-next-line no-useless-concat,prefer-template
            question += ', candidates are: \n' + sampleTickets;
          } else {
            question += ': ';
          }
          return cliPrompt.ask({
            question,
          });
        }
      }).then((result) => {
        issueChosen = result.answer;
        return this.jiraFacade.retrieveIssueByKey(issueChosen);
      }).catch((err) => {
        const errorMessage = _.get(err, 'error.errorMessages[0]', '');
        if (err.statusCode === 400 && errorMessage.match(/The issue key.*/)) {
          return [];
        }
        // better error handling would be sweet.
        throw err;
      })
      .then((issuesFound) => {
        if (issuesFound.length) {
          return issuesFound[0];
        }
        console.log(`I'm sorry but it seems that issue "${issueChosen}" does not exist.`);
        return this._chooseJiraIssue();
      });
  }

  /**
   * THE best function I've ever named. This function is THE CORE of this whole
   * script. Without it, it would be a souless piece of code, executing until
   * the universe cools so much that there is no energy left to power the
   * processor executing the algorithm.
   * What does this function do? Glad you asked.
   * You see, waka time measures the time you are in your IDE, but programming
   * is an art form that requires google, stackoverflow, coffee and sometimes
   * a little bit of youtube. Some folks would think that we're just lazy dudes
   * typing nonsense in a screen with a compulsion to end every line with a
   * semicolon, and browsing the web it is leisure time we give ourselves just
   * for being able to write between two brackets.
   * Those people are "dinasources" (pun intended), when we surf the web we're not
   * only refering to a 90's innacurate term, we're activating our neurons
   * and gathering information. It's like a mental regroup to "fight back" upon a
   * mighty and powerful enemy called A FEATURE. It will not be pretty, so you
   * better be prepared because...boy, it is going to get ugly.
   * Sadly, those epic seconds are not being taken into account by waka time.
   * After months of meticulous observation and armed with a calculator, I've
   * realized that when waka time says 5 hours in the IDE, it is exactly %50
   * accuratelly 8 hours with a delta error of half an hour.
   * So, without further ado, I present you
   * _magicSecretAndEsotericHeuristicalTimeConversion
   * @param {Number} seconds the amount of seconds worked.
   * @returns {Number} Magically secret and esoteric heuristically time converted seconds.
   */
  _magicSecretAndEsotericHeuristicalTimeConversion(seconds) {
    const magicNumber = 1.6; // 8 divided by 5 .
    const estimatedWorkedSecondsButBetterEstimatedThanTheOriginalNumber = seconds * magicNumber;
    return estimatedWorkedSecondsButBetterEstimatedThanTheOriginalNumber;
  }
}

module.exports = TimeFiller;
