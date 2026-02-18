import moment from "moment/moment";
import { read, utils, type WorkBook, type WorkSheet, writeFile } from "xlsx";
import { useFileWorkBookManagment } from "../context/file-workbook";
import { notify } from "../notify";
import type { NewInputTimesheetEntry, OriginalTimesheetEntry, PayrollRow } from "../utils/types";
import { format } from "../utils/utils";

export const useFileWorkBook = () => {
	const context = useFileWorkBookManagment();

	const { timesheetData, setTimesheetData } = context;
	const { timesheetFilename, setTimesheetFilename } = context;

	// Load Timesheet File and output the data
	const proccessXLSXFile = async (file: File, sheet_name: string) => {
		return new Promise<unknown[]>((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = (event) => {
				if (!event?.target?.result) {
					reject("No file data");
				}

				const data = read(event?.target?.result, {
					type: "binary",
					cellDates: true,
					cellNF: false,
					cellText: false,
				});

				const sheetData = utils.sheet_to_json(data?.Sheets?.[sheet_name], {
					raw: false,
					dateNF: format,
					defval: null,
				});

				resolve(sheetData);
			};

			reader.readAsBinaryString(file);
		});
	};

	// Convert Payroll Data to File
	const worksheetsToWorkBook = async (worksheets: { worksheet: WorkSheet; sheet_name: string }[]) => {
		const workbook = utils.book_new();
		worksheets.forEach((worksheet) => {
			utils.book_append_sheet(workbook, worksheet.worksheet, worksheet.sheet_name);
		});
		return workbook;
	};

	const convertListToWorkBook = async (data: Record<string, unknown>[]) => utils.json_to_sheet(data);

	// Download WorkBook
	const downloadWorkBook = async (workbook: WorkBook, filename: string) => {
		writeFile(workbook, filename, { bookType: "xlsx", type: "file" });
	};

	const convertNewTimeSheetToTimesheetEntrys = (
		timesheetData: NewInputTimesheetEntry[],
	): (OriginalTimesheetEntry | null)[] => {
		return timesheetData.map((entry) => {
			const firstName = entry["First name"];
			const lastName = entry["Last name"];

			const [regularHours = 0, regularMinutes = 0] = (entry.Regular?.split(":") ?? []).map(Number);

			const [dailyOtHours = 0, dailyOtMinutes = 0] = (entry["Daily overtime hours"]?.split(":") ?? []).map(Number);

			if (entry.Job === "Unpaid Leave") {
				return null;
			}

			if (!entry["Start Date"] || !entry["Start time"] || !entry["End Date"] || !entry["End time"]) {
				notify.warn(`Missing date/time in entry for ${firstName} ${lastName}`);
				return null;
			}

			const startDate = entry["Start Date"].includes(" ") ? entry["Start Date"].split(" ")[0] : entry["Start Date"];
			const endDate = entry["End Date"].includes(" ") ? entry["End Date"].split(" ")[0] : entry["End Date"];

			const startTime = entry["Start time"].includes(" ") ? entry["Start time"].split(" ")[1] : entry["Start time"];
			const endTime = entry["End time"].includes(" ") ? entry["End time"].split(" ")[1] : entry["End time"];

			const start = moment(`${startDate} ${startTime}`);
			const end = moment(`${endDate} ${endTime}`);
			if (!start.isValid() || !end.isValid()) {
				notify.warn(`Invalid date/time in entry for ${firstName} ${lastName}`);
				throw new Error("Invalid date/time");
			}

			return {
				"First Name": entry["First name"],
				"Last Name": entry["Last name"],
				"Start Time": start,
				"End Time": end,
				Regular: regularHours + regularMinutes / 60,
				OT: dailyOtHours + dailyOtMinutes / 60,
				Schedule: entry.Job || "No Schedule",
			};
		});
	};

	/*
	 * Event Handlers
	 */

	const onTimesheetFileInputChange = async (files: File[], sheet_name: string) => {
		const file = files?.[0] || null;
		// @ts-expect-error
		const timesheetData: NewInputTimesheetEntry[] = await proccessXLSXFile(file, sheet_name);

		const originalTimesheetData = convertNewTimeSheetToTimesheetEntrys(timesheetData).filter(
			(e): e is OriginalTimesheetEntry => e !== null,
		);

		setTimesheetFilename(file?.name || "");
		setTimesheetData(originalTimesheetData);
	};

	// TODO: Make the wooksheets look good!
	const onDownloadPayroll = async (hours: PayrollRow[], sheet_name_hours: string, fileSuffix: string) => {
		const payrollHoursWorkSheet = await convertListToWorkBook(hours);

		const payrollWorkBook = await worksheetsToWorkBook([
			{ worksheet: payrollHoursWorkSheet, sheet_name: sheet_name_hours },
		]);

		const newFilename = `${timesheetFilename.replace(".xlsx", "")}${fileSuffix}.xlsx`;
		return downloadWorkBook(payrollWorkBook, newFilename);
	};

	return { timesheetData, onTimesheetFileInputChange, onDownloadPayroll };
};
