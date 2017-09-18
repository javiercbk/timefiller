const Promise = require('bluebird');
const _ = require('lodash');
const Waka = require('wakatime');
const moment = require('moment');

const timeUtils = require('./time-utils');

class WakaFacade {
  constructor(configuration) {
    this.wi = new Waka(configuration.waka.apiKey);
  }

  dayWorkSeconds(date, allProjects = []) {
    const worked = {
      date: date,
      seconds: 0,
    };
    return this.retrieveDay(date).then((response) => {
      const jsonResponse = JSON.parse(response);
      const projects = _.get(jsonResponse, 'data.0.projects');
      let filter = () => true;
      if (allProjects && allProjects.length) {
        filter = p => allProjects.indexOf(p.name) !== -1;
      }
      const totalWork = projects.filter(filter).map(p => p.total_seconds);
      if (totalWork.length) {
        worked.seconds = totalWork.reduce((sum, value) => sum + value);
      }
      return worked;
    });
  }

  lastLaboralDayWorkSeconds(allProjects = []) {
    const date = timeUtils.lastWorkDay();
    return this.dayWorkSeconds(date, allProjects);
  }

  yesterdayWorkSeconds(allProjects = []) {
    return this.dayWorkSeconds(moment().add(-1, 'day'), allProjects);
  }

  retrieveDay(date) {
    return new Promise((resolve, reject) => {
      const utcDate = moment(date).utc();
      this.wi.summaries(utcDate.format('YYYY-MM-DD'), (err, response, summary) => {
        if (err) {
          reject(err);
        } else {
          resolve(summary, response);
        }
      });
    });
  }

  last7Days() {
    return this._retrieveStats('last_7_days');
  }

  _retrieveStats(statFilter) {
    return new Promise((resolve, reject) => {
      this.wi.stats(statFilter, (error, response, stats) => {
        if (error) {
          reject(error);
        } else {
          resolve(stats, response);
        }
      });
    });
  }
}

module.exports = WakaFacade;
