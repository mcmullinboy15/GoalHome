import { useContext } from "react";
import {
  PayRate,
  PayRateFileHeaders,
  PayrollRow,
  OriginalTimesheetEntry,
  NewTimesheetFileHeaders,
} from "../utils/types";
import { format, isDay, toDateRange } from "../utils/utils";
import { PayrollContext } from "../context/payroll";
import _ from "lodash";
import moment from "moment";
import { notify } from "../common/notify";

export const verifyPayrollData = (
  payRatesData: PayRate[] | null,
  timesheetData: OriginalTimesheetEntry[]
): boolean => {
  if (payRatesData && payRatesData.length === 0) {
    notify.error(
      "No rows in the provided Pay Rates Data (Pay rates file is now optional)"
    );
    return false;
  }

  if (!timesheetData || timesheetData.length === 0) {
    console.log({ timesheetData });
    notify.error("Missing Timesheet Data");
    return false;
  }

  // Verify Names
  const payRatesNames = (payRatesData ?? []).map(
    (pr) => pr["FIRST"].toUpperCase() + " " + pr["LAST"].toUpperCase()
  );

  const timesheetNames = timesheetData.map(
    (ts) => ts["First Name"].toUpperCase() + " " + ts["Last Name"].toUpperCase()
  );

  const missingPayRates = Array.from(
    new Set(timesheetNames.filter((name) => !payRatesNames.includes(name)))
  );

  const missingTimesheet = Array.from(
    new Set(payRatesNames.filter((name) => !timesheetNames.includes(name)))
  );

  if (payRatesData && missingPayRates.length > 0) {
    notify.warn(`Missing Pay Rates for ${missingPayRates.join(", ")}`);
  }

  if (payRatesData && missingTimesheet.length > 0) {
    notify.warn(`Missing Timesheet for ${missingTimesheet.join(", ")}`);
  }

  // Verify Headers

  const payRatesHeaders = payRatesData ? Object.keys(payRatesData[0]) : [];

  const timesheetHeaders = Object.keys(timesheetData[0]);

  const missingPayRatesHeaders = PayRateFileHeaders.filter(
    (header) => !payRatesHeaders.includes(header)
  );

  const missingTimesheetHeaders = NewTimesheetFileHeaders.filter(
    (header) => !timesheetHeaders.includes(header)
  );

  if (payRatesData && missingPayRatesHeaders.length > 0) {
    notify.error(
      `Missing Pay Rates Headers for ${missingPayRatesHeaders.join(", ")}`
    );
    return false;
  }

  if (payRatesData && missingTimesheetHeaders.length > 0) {
    notify.error(
      `Missing Timesheet Headers for ${missingTimesheetHeaders.join(", ")}`
    );
    return false;
  }

  console.log("Payroll Data Verified");
  return true;
};

export const runPayroll = (
  payRatesData: PayRate[] | null,
  timesheet: OriginalTimesheetEntry[],
  pextra: number = 2
): [PayrollRow[], PayrollRow[]] => {
  // OT
  // Week
  // Paddington

  console.log({ timesheet });

  const counts = {} as any;

  // "name":"week":"shift":{day, night, dayot, nightot, pday, pnight, pdayot, pnightot}
  const summary_minutes = {} as any;

  // Loop through each pay rate
  timesheet.forEach((shift, shiftIndex) => {
    shift["Start Time"] = moment
      .utc(shift["Start Time"], format)
      .clone()
      .local();
    shift["End Time"] = moment.utc(shift["End Time"], format).clone().local();

    const name = shift["First Name"] + " " + shift["Last Name"];
    const loc = shift["Schedule"];
    const isPaddington = [
      "Padd Upstairs",
      "Padd Grave",
      "Padd Downstairs",
      "Padd B Grave",
    ].includes(loc);

    const range = toDateRange(shift["Start Time"], shift["End Time"]);
    range.forEach((date) => {
      const isday = isDay(date);
      const week = date.isoWeek();

      summary_minutes[name] = summary_minutes[name] || {};
      summary_minutes[name][week] = summary_minutes[name][week] || {};
      summary_minutes[name][week][shiftIndex] = summary_minutes[name][week][
        shiftIndex
      ] || {
        day: 0,
        night: 0,
        dayot: 0,
        nightot: 0,
        pday: 0,
        pnight: 0,
        pdayot: 0,
        pnightot: 0,
      };

      counts[name] = counts[name] || {};
      counts[name][week] = counts[name][week] || 0;

      // Update the count for the week
      counts[name][week]++;

      // Determine if the shift is overtime, day, night, or paddington
      const isOvertime = counts[name][week] > 40 * 60;

      // Determine the key to use for the week
      let key = ((isPaddington ? "p" : "") +
        (isday ? "day" : "night") +
        (isOvertime ? "ot" : "")) as any;

      // Add the date to the week
      summary_minutes[name][week][shiftIndex][key]++;
    });
  });

  // Loop through summary and get hours
  const summary_hours = {} as any;
  Object.keys(summary_minutes).forEach((name) => {
    Object.keys(summary_minutes[name]).forEach((week) => {
      Object.keys(summary_minutes[name][week]).forEach((shiftIndex) => {
        const shift = timesheet[shiftIndex as any];
        const name = shift["First Name"] + " " + shift["Last Name"];

        // Get hours
        const roundNum = 8;
        const hours = {
          day: _.round(
            _.divide(summary_minutes[name][week][shiftIndex].day, 60),
            roundNum
          ),
          night: _.round(
            _.divide(summary_minutes[name][week][shiftIndex].night, 60),
            roundNum
          ),
          dayot: _.round(
            _.divide(summary_minutes[name][week][shiftIndex].dayot, 60),
            roundNum
          ),
          nightot: _.round(
            _.divide(summary_minutes[name][week][shiftIndex].nightot, 60),
            roundNum
          ),
          pday: _.round(
            _.divide(summary_minutes[name][week][shiftIndex].pday, 60),
            roundNum
          ),
          pnight: _.round(
            _.divide(summary_minutes[name][week][shiftIndex].pnight, 60),
            roundNum
          ),
          pdayot: _.round(
            _.divide(summary_minutes[name][week][shiftIndex].pdayot, 60),
            roundNum
          ),
          pnightot: _.round(
            _.divide(summary_minutes[name][week][shiftIndex].pnightot, 60),
            roundNum
          ),
        };

        // Add to hours summary
        summary_hours[name] = summary_hours[name] || {};
        summary_hours[name][week] = summary_hours[name][week] || {};
        summary_hours[name][week][shiftIndex] = hours;
      });
    });
  });

  // Summarize hours to the Week
  const summary_hours_week = {} as any;
  Object.keys(summary_hours).forEach((name) => {
    summary_hours_week[name] = summary_hours_week[name] || {};
    Object.keys(summary_hours[name]).forEach((week) => {
      summary_hours_week[name][week] = summary_hours_week[name][week] || {
        day: 0,
        night: 0,
        dayot: 0,
        nightot: 0,
        pday: 0,
        pnight: 0,
        pdayot: 0,
        pnightot: 0,
      };
      Object.keys(summary_hours[name][week]).forEach((shiftIndex) => {
        const shift = summary_hours[name][week][shiftIndex];
        summary_hours_week[name][week].day = _.round(
          summary_hours_week[name][week].day + shift.day,
          2
        );
        summary_hours_week[name][week].night = _.round(
          summary_hours_week[name][week].night + shift.night,
          2
        );
        summary_hours_week[name][week].dayot = _.round(
          summary_hours_week[name][week].dayot + shift.dayot,
          2
        );
        summary_hours_week[name][week].nightot = _.round(
          summary_hours_week[name][week].nightot + shift.nightot,
          2
        );
        summary_hours_week[name][week].pday = _.round(
          summary_hours_week[name][week].pday + shift.pday,
          2
        );
        summary_hours_week[name][week].pnight = _.round(
          summary_hours_week[name][week].pnight + shift.pnight,
          2
        );
        summary_hours_week[name][week].pdayot = _.round(
          summary_hours_week[name][week].pdayot + shift.pdayot,
          2
        );
        summary_hours_week[name][week].pnightot = _.round(
          summary_hours_week[name][week].pnightot + shift.pnightot,
          2
        );
      });
    });
  });

  // Summarize hours to the Pay Rate
  const summary_payrate = {} as any;
  Object.keys(summary_hours).forEach((name) => {
    summary_payrate[name] = summary_payrate[name] || {
      day: 0,
      night: 0,
      dayot: 0,
      nightot: 0,
      pday: 0,
      pnight: 0,
      pdayot: 0,
      pnightot: 0,
    };
    Object.keys(summary_hours_week[name]).forEach((week) => {
      const weekObj = summary_hours_week[name][week];
      summary_payrate[name].day = _.round(
        summary_payrate[name].day + weekObj.day,
        2
      );
      summary_payrate[name].night = _.round(
        summary_payrate[name].night + weekObj.night,
        2
      );
      summary_payrate[name].dayot = _.round(
        summary_payrate[name].dayot + weekObj.dayot,
        2
      );
      summary_payrate[name].nightot = _.round(
        summary_payrate[name].nightot + weekObj.nightot,
        2
      );
      summary_payrate[name].pday = _.round(
        summary_payrate[name].pday + weekObj.pday,
        2
      );
      summary_payrate[name].pnight = _.round(
        summary_payrate[name].pnight + weekObj.pnight,
        2
      );
      summary_payrate[name].pdayot = _.round(
        summary_payrate[name].pdayot + weekObj.pdayot,
        2
      );
      summary_payrate[name].pnightot = _.round(
        summary_payrate[name].pnightot + weekObj.pnightot,
        2
      );
    });
  });

  /**
   * Final Payroll Conversion
   * 'summary_payrate' is the final payroll data
   *
   * Here we convert to Hours and Dollars Tables
   */

  const payrollHours: PayrollRow[] = [];
  const payrollDollars: PayrollRow[] = [];

  Object.keys(summary_payrate).forEach((name) => {
    const shifts = timesheet.filter(
      (shift) =>
        (shift["First Name"] + " " + shift["Last Name"]).toUpperCase() ===
        name.toUpperCase()
    );

    const totalreg_hours = _.round(
      summary_payrate[name].day +
        summary_payrate[name].night +
        summary_payrate[name].pday +
        summary_payrate[name].pnight,
      2
    );
    const totalot_hours = _.round(
      summary_payrate[name].dayot +
        summary_payrate[name].nightot +
        summary_payrate[name].pdayot +
        summary_payrate[name].pnightot,
      2
    );
    const total_hours = _.round(totalreg_hours + totalot_hours, 2);

    const originalRegularHours = shifts.reduce(
      // @ts-ignore
      (a, v) => a + parseFloat(v.Regular ?? 0),
      0
    );
    // @ts-ignore
    const originalOTHours = shifts.reduce(
      // @ts-ignore
      (a, v) => a + parseFloat(v.OT ?? 0),
      0
    );
    // @ts-ignore
    const originalTotalHours = shifts.reduce(
      // @ts-ignore
      (a, v) => a + parseFloat(v.Regular ?? 0) + parseFloat(v.OT ?? 0),
      0
    );

    const hoursRow: PayrollRow = {
      lastName: shifts[0]["Last Name"],
      firstName: shifts[0]["First Name"],

      ...summary_payrate[name],

      totalreg: totalreg_hours,
      totalot: totalot_hours,
      total: total_hours,

      diffreg: _.round(totalreg_hours - originalRegularHours, 2),
      diffot: _.round(totalot_hours - originalOTHours, 2),
      difftotal: _.round(total_hours - originalTotalHours, 2),
    };

    payrollHours.push(hoursRow);

    /**
     * Convert to Dollars
     */

    const payRate = payRatesData?.find(
      (pr) =>
        (pr["FIRST"] + " " + pr["LAST"]).toUpperCase() === name.toUpperCase()
    );
    if (!payRate) {
      // console.error(`No pay rate found for ${name}`);
      return null;
    }

    console.log({ payRate, summary_payrate: summary_payrate[name] });

    payRate["Day Rate"] = parseFloat(payRate["Day Rate"] as any);
    payRate["Night Rate"] = parseFloat(payRate["Night Rate"] as any);

    const day = summary_payrate[name].day * payRate["Day Rate"];
    const night = summary_payrate[name].night * payRate["Night Rate"];
    const pday = summary_payrate[name].pday * (payRate["Day Rate"] + pextra);
    const pnight =
      summary_payrate[name].pnight * (payRate["Night Rate"] + pextra);
    const dayot = summary_payrate[name].dayot * 1.5 * payRate["Day Rate"];
    const nightot = summary_payrate[name].nightot * 1.5 * payRate["Night Rate"];
    const pdayot =
      summary_payrate[name].pdayot * 1.5 * (payRate["Day Rate"] + pextra);
    const pnightot =
      summary_payrate[name].pnightot * 1.5 * (payRate["Night Rate"] + pextra);

    const totalreg_dollars = day + night + pday + pnight;
    const totalot_dollars = dayot + nightot + pdayot + pnightot;
    const total_dollars = totalreg_dollars + totalot_dollars;

    const dollarsRow: PayrollRow = {
      firstName: payRate["FIRST"],
      lastName: payRate["LAST"],
      day: _.round(day, 2),
      night: _.round(night, 2),
      pday: _.round(pday, 2),
      pnight: _.round(pnight, 2),
      dayot: _.round(dayot, 2),
      nightot: _.round(nightot, 2),
      pdayot: _.round(pdayot, 2),
      pnightot: _.round(pnightot, 2),

      totalreg: _.round(totalreg_dollars, 2),
      totalot: _.round(totalot_dollars, 2),
      total: _.round(total_dollars, 2),
    } as PayrollRow;

    payrollDollars.push(dollarsRow);
  });

  return [payrollHours, payrollDollars];
};

export const usePayroll = () => {
  const { payrollHours, payrollDollars, setPayrollHours, setPayrollDollars } =
    useContext(PayrollContext);

  return {
    payrollHours,
    payrollDollars,
    runPayroll: (
      payRatesData: PayRate[] | null,
      timesheetData: OriginalTimesheetEntry[] | null
    ) => {
      if (!timesheetData) {
        notify.error("Missing Timesheet Data");
        return [];
      }

      const isValid = verifyPayrollData(payRatesData, timesheetData);
      if (!isValid) {
        return [];
      }

      const [payrollHours, payrollDollars] = runPayroll(
        payRatesData,
        timesheetData
      );

      setPayrollHours(payrollHours);
      setPayrollDollars(payrollDollars);
    },
  };
};
