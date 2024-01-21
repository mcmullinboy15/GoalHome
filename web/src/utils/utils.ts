import moment from "moment";

export const format = "MM-DD-YYYY HH:mm:ss";

const _isoWeek = moment.fn.isoWeek;
// @ts-ignore
moment.fn.isoWeek = function (week: number) {
  var out: number = _isoWeek.call(this, week) as any;
  if (this.day() === 0) out += 1;
  if (out === 53) return 1;
  return out;
};

// Helper function to generate date ranges
export const toDateRange = (
  start: moment.Moment,
  end: moment.Moment,
  interval: "days" | "hours" | "minutes" = "minutes"
): moment.Moment[] => {
  let dates: moment.Moment[] = [];
  start = start.clone().startOf(interval);
  end = end.clone().startOf(interval);

  while (start < end) {
    dates.push(start.clone().startOf(interval));
    start = start.add(1, interval);
  }

  return dates;
};

export const isDay = (date: moment.Moment) =>
  date.hour() >= 6 && date.hour() < 22;
export const isNight = (date: moment.Moment) =>
  date.hour() < 6 || date.hour() >= 22;
