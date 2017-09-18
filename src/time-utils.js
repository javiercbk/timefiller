const moment = require('moment');

module.exports = {
  lastWorkDate: function (date) {
    const now = date || moment();
    const today = now.day();
    let minusDays;
    switch (today) {
      case 0:
        // sunday, getting work from friday.
        minusDays = -2;
        break;
      case 1:
        // monday, getting work from friday.
        minusDays = -3;
        break;
      default:
        minusDays = -1;
        break;
    }
    return now.add(minusDays, 'day');
  },
};
