import type moment from "moment";

export type NewInputTimesheetEntry = {
	"Daily total hours": string | null; // "04:00"
	"Employee notes": string | null;
	"Shift hours": string | null; // "04:00"
	"Total Overtime x1.5": string | null; // null
	"Total Paid Hours": string | null; // "04:00"
	"Total Regular": string | null; // "04:00"
	"Total overtime": string | null; // null
	"Total paid time off hours": string | null; // null
	"Total unpaid time off hours": string | null; // null
	"Total work hours": string | null; // "04:00"
	"Weekly total hours": string | null; // "04:00"
	"Manager notes": string | null; // null

	// Job	Start Date	Start time	End Date	End time
	"First name": string; // "Calista"
	"Last name": string; // "Nielsen"
	Job: string | null; // "Westland"
	"Start Date": string | null; // "08/30/2025"
	"Start time": string | null; // "11:00 AM"
	"End Date": string | null; // "08/30/2025"
	"End time": string | null; // "03:00 PM"

	// From other timesheet

	Regular: string | null; // "04:00",
	"Daily overtime hours": string | null; // "2:19",
};

export type OriginalTimesheetEntry = {
	"First Name": string;
	"Last Name": string;
	"Start Time": moment.Moment;
	"End Time": moment.Moment;
	Regular: number | null;
	OT: number | null;
	Schedule: string;

	"Employee ID"?: string;
	Date?: moment.Moment;
	"Unpaid Breaks"?: number;
	"Hourly Rate"?: number;
	"Double OT"?: number;
	"Paid Total"?: number;
	"Job Site"?: string;
	Position?: string;
	"Manager Note"?: string;
	"Clock In Note"?: string;
	"Clock Out Note"?: string;
};

export type InputShift = {
	"First Name": string;
	"Last Name": string;
	"Start Time": moment.Moment;
	"End Time": moment.Moment;
	Regular: number;
	OT: number;
	Schedule: string;

	"Employee ID"?: string;
	Date?: moment.Moment;
	"Unpaid Breaks"?: number;
	"Hourly Rate"?: number;
	"Double OT"?: number;
	"Paid Total"?: number;
	"Job Site"?: string;
	Position?: string;
	"Manager Note"?: string;
	"Clock In Note"?: string;
	"Clock Out Note"?: string;
};

export type OutputShift = {
	day: number;
	night: number;
	dayot: number;
	nightot: number;
};

export type PayrollEntry = {
	lastName: string;
	firstName: string;
	day: number;
	night: number;
	pday: number;
	pnight: number;
	dayot: number;
	nightot: number;
	pdayot: number;
	pnightot: number;
};

export type PayrollRow = PayrollEntry & {
	totalreg: number;
	totalot: number;
	total: number;
	diffreg?: number;
	diffot?: number;
	difftotal?: number;
};

// Moved the 4 dates over and renamed Job to Type

export const NewTimesheetFileHeaders = [
	// "Daily total hours",
	// "Employee notes",
	// "End Date",
	// "First name",
	// "In",
	// "Last name",
	// "Manager notes",
	// "Out",
	// "Shift hours",
	// "Start Date",
	// "Total Overtime x1.5",
	// "Total Paid Hours",
	// "Total Regular",
	// "Total overtime",
	// "Total paid time off hours",
	// "Total unpaid time off hours",
	// "Total work hours",
	// "Type",
	// "Weekly total hours",

	// From other timesheet
	// "Regular",
	// "Daily overtime hours",

	// Required Columns?
	"First Name",
	"Last Name",
	"Start Time",
	"End Time",
	"Regular",
	"OT",
	"Schedule",
];

export const OriginalTimesheetFileHeaders = [
	"First Name",
	"Last Name",
	"Start Time",
	"End Time",
	"Regular",
	"OT",
	"Schedule",
	"Employee ID",
	"Date",
	"Unpaid Breaks",
	"Hourly Rate",
	"Double OT",
	"Paid Total",
	"Job Site",
	"Position",
	"Manager Note",
	"Clock In Note",
	"Clock Out Note",
];

export enum PayrollColumns {
	LastName = "lastName",
	FirstName = "firstName",
	Day = "day",
	Night = "night",
	PaddingtonNight = "pnight",
	NightOT = "nightot",
	PaddingtonNightOT = "pnightot",
	DayOT = "dayot",
	PaddingtonDayOT = "pdayot",
	PaddingtonDay = "pday",
	TotalRegular = "totalreg",
	TotalOT = "totalot",
	TotalHours = "total",
	DiffRegular = "diffreg",
	DiffOT = "diffot",
	DiffTotal = "difftotal",
	DiffFix = "difffix",
}
