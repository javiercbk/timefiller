const moment = require('moment');

module.exports = {
  lastWorkDate: function(date) {
    const now = date || moment();
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
    return now.add(minusDays, 'day');
  }
};
