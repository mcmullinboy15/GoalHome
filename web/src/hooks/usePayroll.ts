import _ from "lodash";
import moment from "moment";
import { useContext } from "react";
import { notify } from "../common/notify";
import { PayrollContext } from "../context/payroll";
import {
	NewTimesheetFileHeaders,
	type OriginalTimesheetEntry,
	type PayRate,
	PayRateFileHeaders,
	type PayrollRow,
} from "../utils/types";
import { format, isDay, toDateRange } from "../utils/utils";

export const verifyPayrollData = (
	payRatesData: PayRate[] | null,
	timesheetData: OriginalTimesheetEntry[],
) => {
	if (payRatesData && payRatesData.length === 0) {
		notify.error(
			"No rows in the provided Pay Rates Data (Pay rates file is now optional)",
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
		(pr) => `${pr.FIRST.toUpperCase()} ${pr.LAST.toUpperCase()}`,
	);

	const timesheetNames = timesheetData.map(
		(ts) =>
			`${ts["First Name"].toUpperCase()} ${ts["Last Name"].toUpperCase()}`,
	);

	const missingPayRates = Array.from(
		new Set(timesheetNames.filter((name) => !payRatesNames.includes(name))),
	);

	const missingTimesheet = Array.from(
		new Set(payRatesNames.filter((name) => !timesheetNames.includes(name))),
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
		(header) => !payRatesHeaders.includes(header),
	);

	const missingTimesheetHeaders = NewTimesheetFileHeaders.filter(
		(header) => !timesheetHeaders.includes(header),
	);

	if (payRatesData && missingPayRatesHeaders.length > 0) {
		notify.error(
			`Missing Pay Rates Headers for ${missingPayRatesHeaders.join(", ")}`,
		);
		return false;
	}

	if (payRatesData && missingTimesheetHeaders.length > 0) {
		notify.error(
			`Missing Timesheet Headers for ${missingTimesheetHeaders.join(", ")}`,
		);
		return false;
	}

	console.log("Payroll Data Verified");
	return true;
};

const defaultRow = () => ({
	day: 0,
	night: 0,
	dayot: 0,
	nightot: 0,
	pday: 0,
	pnight: 0,
	pdayot: 0,
	pnightot: 0,
});

type OutputRow = ReturnType<typeof defaultRow>;

export const runPayroll = (
	payRatesData: PayRate[] | null,
	timesheet: OriginalTimesheetEntry[],
	pextra: number = 2,
) => {
	const counts: Record<string, Record<number, number>> = {};
	const summary_minutes: Record<
		string,
		Record<string, Record<number, OutputRow>>
	> = {};

	// Loop through each pay rate
	timesheet.forEach((shift, shiftIndex) => {
		const startTime = moment.utc(shift["Start Time"], format).clone().local();
		const endTime = moment.utc(shift["End Time"], format).clone().local();

		const name = `${shift["First Name"]} ${shift["Last Name"]}`;
		const loc = shift.Schedule;
		const isPaddington = [
			"Padd Upstairs".toLowerCase(),
			"Padd Grave".toLowerCase(),
			"Padd Downstairs".toLowerCase(),
			"Padd B Grave".toLowerCase(),
		].includes(loc.toLowerCase());

		const range = toDateRange(startTime, endTime);
		range.forEach((date) => {
			const isday = isDay(date);
			const week = date.isoWeek();

			summary_minutes[name] = summary_minutes[name] || {};
			summary_minutes[name][week] = summary_minutes[name][week] || {};
			summary_minutes[name][week][shiftIndex] =
				summary_minutes[name][week][shiftIndex] || defaultRow();

			counts[name] = counts[name] || {};
			counts[name][week] = counts[name][week] || 0;

			// Update the count for the week
			counts[name][week]++;

			// Determine if the shift is overtime, day, night, or paddington
			const isOvertime = counts[name][week] > 40 * 60;

			// Determine the key to use for the week
			// @ts-expect-error
			const key: keyof OutputRow =
				(isPaddington ? "p" : "") +
				(isday ? "day" : "night") +
				(isOvertime ? "ot" : "");

			// Add the date to the week
			summary_minutes[name][week][shiftIndex][key]++;
		});
	});

	// Loop through summary and get hours
	const summary_hours: Record<
		string,
		Record<string, Record<string, OutputRow>>
	> = {};
	Object.keys(summary_minutes).forEach((name) => {
		Object.keys(summary_minutes[name]).forEach((week) => {
			Object.keys(summary_minutes[name][week]).forEach((shiftIndex) => {
				const shiftIndexNum = parseInt(shiftIndex);
				const shift = timesheet[shiftIndexNum];
				const name = `${shift["First Name"]} ${shift["Last Name"]}`;

				// Get hours
				const roundNum = 8;
				const hours = {
					day: _.round(
						_.divide(summary_minutes[name][week][shiftIndexNum].day, 60),
						roundNum,
					),
					night: _.round(
						_.divide(summary_minutes[name][week][shiftIndexNum].night, 60),
						roundNum,
					),
					dayot: _.round(
						_.divide(summary_minutes[name][week][shiftIndexNum].dayot, 60),
						roundNum,
					),
					nightot: _.round(
						_.divide(summary_minutes[name][week][shiftIndexNum].nightot, 60),
						roundNum,
					),
					pday: _.round(
						_.divide(summary_minutes[name][week][shiftIndexNum].pday, 60),
						roundNum,
					),
					pnight: _.round(
						_.divide(summary_minutes[name][week][shiftIndexNum].pnight, 60),
						roundNum,
					),
					pdayot: _.round(
						_.divide(summary_minutes[name][week][shiftIndexNum].pdayot, 60),
						roundNum,
					),
					pnightot: _.round(
						_.divide(summary_minutes[name][week][shiftIndexNum].pnightot, 60),
						roundNum,
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
	const summary_hours_week: Record<string, Record<string, OutputRow>> = {};
	Object.keys(summary_hours).forEach((name) => {
		summary_hours_week[name] = summary_hours_week[name] || {};
		Object.keys(summary_hours[name]).forEach((week) => {
			summary_hours_week[name][week] =
				summary_hours_week[name][week] || defaultRow();
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
				`${shift["First Name"]} ${shift["Last Name"]}`.toUpperCase() ===
				name.toUpperCase(),
		);

		const payrateSummary = summary_payrate[name];

		const totalreg_hours_raw =
			payrateSummary.day +
			payrateSummary.night +
			payrateSummary.pday +
			payrateSummary.pnight;
		const totalot_hours_raw =
			payrateSummary.dayot +
			payrateSummary.nightot +
			payrateSummary.pdayot +
			payrateSummary.pnightot;

		const totalreg_hours = _.round(totalreg_hours_raw, 2);
		const totalot_hours = _.round(totalot_hours_raw, 2);
		const total_hours_raw = totalreg_hours_raw + totalot_hours_raw;
		const total_hours = _.round(total_hours_raw, 2);

                const originalRegularHoursRaw = shifts.reduce((a, v) => {
                        if (name.includes("Clara")) {
                                console.log({ a, Regular: v.Regular ?? 0 });
                        }
                        // @ts-expect-error
                        return a + parseFloat(v.Regular ?? 0);
                }, 0);
                const originalOTHoursRaw = shifts.reduce(
                        // @ts-expect-error
                        (a, v) => a + parseFloat(v.OT ?? 0),
                        0,
                );
                const originalTotalHoursRaw = shifts.reduce(
                        // @ts-expect-error
                        (a, v) => a + parseFloat(v.Regular ?? 0) + parseFloat(v.OT ?? 0),
                        0,
                );

                const originalRegularHours = _.round(originalRegularHoursRaw, 2);
                const originalOTHours = _.round(originalOTHoursRaw, 2);
                const originalTotalHours = _.round(originalTotalHoursRaw, 2);

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
		if (name.includes("Clara")) {
			console.log({ diffreg, totalreg_hours_raw, originalRegularHours });
			console.log({ diffot, totalot_hours_raw, originalOTHours });
			console.log({ difftotal, total_hours_raw, originalTotalHours });
			console.log({ name, shifts, hoursRow });
		}

		payrollHours.push(hoursRow);

		/**
		 * Convert to Dollars
		 */

		const payRate = payRatesData?.find(
			(pr) => `${pr.FIRST} ${pr.LAST}`.toUpperCase() === name.toUpperCase(),
		);
		if (!payRate) {
			return;
		}

		// @ts-expect-error
		payRate["Day Rate"] = parseFloat(payRate["Day Rate"]);
		// @ts-expect-error
		payRate["Night Rate"] = parseFloat(payRate["Night Rate"]);

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
			firstName: payRate.FIRST,
			lastName: payRate.LAST,
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
		};

		payrollDollars.push(dollarsRow);
	});

	console.log({ payrollHours, payrollDollars });

	return [payrollHours, payrollDollars];
};

export const usePayroll = () => {
	const { payrollHours, payrollDollars, setPayrollHours, setPayrollDollars } =
		useContext(PayrollContext);

	const handleRunPayroll = (
		payRatesData: PayRate[] | null,
		timesheetData: OriginalTimesheetEntry[] | null,
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
			timesheetData,
		);

		setPayrollHours(payrollHours);
		setPayrollDollars(payrollDollars);
	};

	return {
		payrollHours,
		payrollDollars,
		runPayroll: handleRunPayroll,
	};
};
