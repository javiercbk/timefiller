const Promise = require('bluebird');
const Harvest = require('harvest');
const moment = require('moment');

class HarvestFacade {
  constructor(configuration) {
    this.harvest = new Harvest({
      subdomain: configuration.harvest.subdomain,
      email: configuration.harvest.email,
      password: configuration.harvest.password,
    });
  }

  retrieveWorkedHours(date) {
    return new Promise((resolve, reject) => {
      this.harvest.timeTracking.daily({ date }, (err, tasks) => {
        if (err) {
          reject(err);
        } else {
          resolve(tasks);
        }
      });
    });
  }

  updateWorkedHours(id, projectId, hours) {
    return new Promise((resolve, reject) => {
      this.harvest.TimeTracking.update(id, { Hours: hours }, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  createWorkedHours(projectId, taskId, date, hours) {
    const formattedDay = moment(date).format('YYYY-MM-DD');
    return new Promise((resolve, reject) => {
      this.harvest.timeTracking.create({
        spent_at: formattedDay,
        project_id: projectId,
        task_id: taskId,
        hours: hours,
      }, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }
}

module.exports = HarvestFacade;
