import _ from "lodash";
import moment from "moment";
import { notify } from "../common/notify";
import { NewTimesheetFileHeaders, type OriginalTimesheetEntry, type PayrollRow } from "../utils/types";
import { format, isDay, toDateRange } from "../utils/utils";

export const verifyPayrollData = (timesheetData: OriginalTimesheetEntry[]) => {
	if (!timesheetData || timesheetData.length === 0) {
		notify.error("Missing Timesheet Data");
		return false;
	}

	// Verify Headers
	const timesheetHeaders = Object.keys(timesheetData[0]);
	const missingTimesheetHeaders = NewTimesheetFileHeaders.filter((header) => !timesheetHeaders.includes(header));
	if (missingTimesheetHeaders.length > 0) {
		notify.error(`Missing Timesheet Headers for ${missingTimesheetHeaders.join(", ")}`);
		return false;
	}

	return true;
};

const defaultRow = () => ({ day: 0, night: 0, dayot: 0, nightot: 0, pday: 0, pnight: 0, pdayot: 0, pnightot: 0 });
const paddingtonSchedules = new Set(["paddington", "padd upstairs", "padd grave"]);
// Add "Padd Downstairs" or "Padd B Grave" back to the set if they should earn the bonus again.

const isPaddingtonSchedule = (schedule: unknown) =>
        typeof schedule === "string" && paddingtonSchedules.has(schedule.trim().toLowerCase());

type OutputRow = ReturnType<typeof defaultRow>;

export const calculatePayrollHours = (timesheet: OriginalTimesheetEntry[]) => {
	const counts: Record<string, Record<number, number>> = {};
	const summary_minutes: Record<string, Record<string, Record<number, OutputRow>>> = {};

	// Loop through each pay rate
	timesheet.forEach((shift, shiftIndex) => {
		const startTime = moment.utc(shift["Start Time"], format).clone().local();
		const endTime = moment.utc(shift["End Time"], format).clone().local();

		const name = `${shift["First Name"]} ${shift["Last Name"]}`;
                const loc = shift.Schedule;
                const isPaddington = isPaddingtonSchedule(loc);

		const range = toDateRange(startTime, endTime);
		range.forEach((date) => {
			const isday = isDay(date);
			const week = date.isoWeek();

			summary_minutes[name] = summary_minutes[name] || {};
			summary_minutes[name][week] = summary_minutes[name][week] || {};
			summary_minutes[name][week][shiftIndex] = summary_minutes[name][week][shiftIndex] || defaultRow();

			counts[name] = counts[name] || {};
			counts[name][week] = counts[name][week] || 0;

			// Update the count for the week
			counts[name][week]++;

			// Determine if the shift is overtime, day, night, or paddington
			const isOvertime = counts[name][week] > 40 * 60;

			// Determine the key to use for the week
			// @ts-expect-error
			const key: keyof OutputRow = (isPaddington ? "p" : "") + (isday ? "day" : "night") + (isOvertime ? "ot" : "");

			// Add the date to the week
			summary_minutes[name][week][shiftIndex][key]++;
		});
	});

	// Loop through summary and get hours
	const summary_hours: Record<string, Record<string, Record<string, OutputRow>>> = {};
	Object.keys(summary_minutes).forEach((name) => {
		Object.keys(summary_minutes[name]).forEach((week) => {
			Object.keys(summary_minutes[name][week]).forEach((shiftIndex) => {
				const shiftIndexNum = parseInt(shiftIndex);
				const shift = timesheet[shiftIndexNum];
				const name = `${shift["First Name"]} ${shift["Last Name"]}`;

				// Get hours
				const roundNum = 8;
				const hours = {
					day: _.round(_.divide(summary_minutes[name][week][shiftIndexNum].day, 60), roundNum),
					night: _.round(_.divide(summary_minutes[name][week][shiftIndexNum].night, 60), roundNum),
					dayot: _.round(_.divide(summary_minutes[name][week][shiftIndexNum].dayot, 60), roundNum),
					nightot: _.round(_.divide(summary_minutes[name][week][shiftIndexNum].nightot, 60), roundNum),
					pday: _.round(_.divide(summary_minutes[name][week][shiftIndexNum].pday, 60), roundNum),
					pnight: _.round(_.divide(summary_minutes[name][week][shiftIndexNum].pnight, 60), roundNum),
					pdayot: _.round(_.divide(summary_minutes[name][week][shiftIndexNum].pdayot, 60), roundNum),
					pnightot: _.round(_.divide(summary_minutes[name][week][shiftIndexNum].pnightot, 60), roundNum),
				};

				// Add to hours summary
				summary_hours[name] = summary_hours[name] || {};
				summary_hours[name][week] = summary_hours[name][week] || {};
				summary_hours[name][week][shiftIndex] = hours;
			});
		});
	});

	// Summarize hours to the Week
	const summary_hours_week: Record<string, Record<string, OutputRow>> = {};
	Object.keys(summary_hours).forEach((name) => {
		summary_hours_week[name] = summary_hours_week[name] || {};
		Object.keys(summary_hours[name]).forEach((week) => {
			summary_hours_week[name][week] = summary_hours_week[name][week] || defaultRow();
			Object.keys(summary_hours[name][week]).forEach((shiftIndex) => {
				const shift = summary_hours[name][week][shiftIndex];
				summary_hours_week[name][week].day += shift.day;
				summary_hours_week[name][week].night += shift.night;
				summary_hours_week[name][week].dayot += shift.dayot;
				summary_hours_week[name][week].nightot += shift.nightot;
				summary_hours_week[name][week].pday += shift.pday;
				summary_hours_week[name][week].pnight += shift.pnight;
				summary_hours_week[name][week].pdayot += shift.pdayot;
				summary_hours_week[name][week].pnightot += shift.pnightot;
			});
		});
	});

	// Summarize hours to the Pay Rate
	const summary_payrate: Record<string, OutputRow> = {};
	Object.keys(summary_hours).forEach((name) => {
		summary_payrate[name] = summary_payrate[name] || defaultRow();
		Object.keys(summary_hours_week[name]).forEach((week) => {
			const weekObj = summary_hours_week[name][week];
			summary_payrate[name].day += weekObj.day;
			summary_payrate[name].night += weekObj.night;
			summary_payrate[name].dayot += weekObj.dayot;
			summary_payrate[name].nightot += weekObj.nightot;
			summary_payrate[name].pday += weekObj.pday;
			summary_payrate[name].pnight += weekObj.pnight;
			summary_payrate[name].pdayot += weekObj.pdayot;
			summary_payrate[name].pnightot += weekObj.pnightot;
		});
	});

	// Create payroll rows
	const payrollHours: PayrollRow[] = [];

	Object.keys(summary_payrate).forEach((name) => {
		const shifts = timesheet.filter(
			(shift) => `${shift["First Name"]} ${shift["Last Name"]}`.toUpperCase() === name.toUpperCase(),
		);

		const payrateSummary = summary_payrate[name];

		const totalreg_hours_raw = payrateSummary.day + payrateSummary.night + payrateSummary.pday + payrateSummary.pnight;
		const totalot_hours_raw =
			payrateSummary.dayot + payrateSummary.nightot + payrateSummary.pdayot + payrateSummary.pnightot;
		const total_hours_raw = totalreg_hours_raw + totalot_hours_raw;

		const totalot_hours = _.round(totalot_hours_raw, 2);
		const totalreg_hours = _.round(totalreg_hours_raw, 2);
		const total_hours = _.round(total_hours_raw, 2);

		const originalRegularHours = shifts.reduce(
			// @ts-expect-error
			(a, v) => a + parseFloat(v.Regular ?? 0),
			0,
		);
		const originalOTHours = shifts.reduce(
			// @ts-expect-error
			(a, v) => a + parseFloat(v.OT ?? 0),
			0,
		);
		const originalTotalHours = originalRegularHours + originalOTHours;

		const diffreg = _.round(totalreg_hours - originalRegularHours, 2);
		const diffot = _.round(totalot_hours - originalOTHours, 2);
		const difftotal = _.round(total_hours - originalTotalHours, 2);

		const hoursRow: PayrollRow = {
			lastName: shifts[0]["Last Name"],
			firstName: shifts[0]["First Name"],

			day: _.round(payrateSummary.day, 2),
			night: _.round(payrateSummary.night, 2),
			dayot: _.round(payrateSummary.dayot, 2),
			nightot: _.round(payrateSummary.nightot, 2),
			pday: _.round(payrateSummary.pday, 2),
			pnight: _.round(payrateSummary.pnight, 2),
			pdayot: _.round(payrateSummary.pdayot, 2),
			pnightot: _.round(payrateSummary.pnightot, 2),

			totalreg: totalreg_hours,
			totalot: totalot_hours,
			total: total_hours,

			diffreg: diffreg === 0 ? 0 : diffreg,
			diffot: diffot === 0 ? 0 : diffot,
			difftotal: difftotal === 0 ? 0 : difftotal,
		};

		payrollHours.push(hoursRow);
	});

	return payrollHours;
};
