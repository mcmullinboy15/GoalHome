import moment from "moment";

export type Settings = {
  payRatesSheetName: string;
  timesheetSheetName: string;
  payrollSuffix: string;
  payrollHoursSheetName: string;
  payrollPaySheetName: string;
};

export type PayRate = {
  LAST: string;
  FIRST: string;
  "Day Rate": number;
  "Night Rate": number;
};

export type TimesheetEntry = {
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
  // totalreg: number;
  totalot: number;
  total: number;
  diffreg?: number;
  diffot?: number;
  difftotal?: number;
};

export const PayRateFileHeaders = ["LAST", "FIRST", "Day Rate", "Night Rate"];

export const TimesheetFileHeaders = [
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
