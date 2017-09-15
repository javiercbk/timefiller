const Promise = require('bluebird');
const Waka = require('wakatime');
const moment = require('moment');

class WakaFacade {
  constructor(configuration) {
    this.wi = new Waka(configuration.waka.apiKey);
  }

  dayWorkSeconds(date, allProjects = []) {
    const worked = {
      date: date,
      seconds: 0,
    };
    return this.retrieveDay(date).then((response) =>{
      const jsonResponse = JSON.parse(response);
      const projects = jsonResponse.data[0].projects;
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
    const now = moment();
    const today = now.day()
    let minusDays;
    switch(today) {
      case 0:
        // sunday, getting work from friday.
        minusDays = -2;
      case 1:
        // monday, getting work from friday.
        minusDays = -3;
      default:
        minusDays = -1;
    }
    return this.dayWorkSeconds(moment().add(minusDays, 'day'), allProjects);
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

  last7Days(){
    return this._retrieveStats('last_7_days');
  }

  _retrieveStats(statFilter){
    return new Promise((resolve, reject) => {
      this.wi.stats(statFilter, function (error, response, stats) {
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
