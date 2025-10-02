import moment from "moment/moment";
import { useContext } from "react";
import { read, utils, type WorkBook, type WorkSheet, writeFile } from "xlsx";
import { FileWorkBookContext } from "../context/file-workbook";
import { notify } from "../notify";
import type {
	NewInputTimesheetEntry,
	OriginalTimesheetEntry,
	PayRate,
	PayrollRow,
} from "../utils/types";
import { format } from "../utils/utils";

type FileWorkBookManagmentType = {
	payRatesData: PayRate[] | null;
	timesheetData: OriginalTimesheetEntry[] | null;

	onPayRatesFileInputChange: (
		files: FileList,
		sheet_name: string,
	) => Promise<void>;

	onTimesheetFileInputChange: (
		files: FileList,
		sheet_name: string,
	) => Promise<void>;

	onDownloadPayroll: (
		payrollHours: PayrollRow[],
		payrollDollars: PayrollRow[],
		sheet_name_hours: string,
		sheet_name_dollars: string,
		fileSuffix: string,
	) => Promise<void>;
};

export const useFileWorkBookManagment = (): FileWorkBookManagmentType => {
	const context = useContext(FileWorkBookContext);
	if (context === undefined) {
		throw new Error(
			"useFileWorkBookManagment must be used within a FileWorkBookProvider",
		);
	}

	const { payRatesData, setPayRatesData } = context;
	const { timesheetData, setTimesheetData } = context;
	const { timesheetFilename, setTimesheetFilename } = context;

	// const { settings } = useSettings();

	// const payRatesFilename = "pay-rates.xlsx";

	/**
	 * XLSX File Management
	 * TOOD: Move to own file
	 * TODO: Error handling
	 *  - File type
	 *  - Sheet name doesn't exist
	 *  - Headers don't exist
	 */

	// TODO: Move to Context so it doesn't reload so much
	// useEffect(() => {
	//   async function loadPayRates() {
	//     const file = await downloadFile(payRatesFilename);
	//     if (file && file?.size > 0) {
	//       const payRatesData: PayRate[] = await proccessXLSXFile(
	//         file,
	//         settings.payRatesSheetName
	//       );
	//       setPayRatesData(payRatesData);
	//     }
	//   }
	//   void loadPayRates();
	// }, []);

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
	const worksheetsToWorkBook = async (
		worksheets: { worksheet: WorkSheet; sheet_name: string }[],
	) => {
		const workbook = utils.book_new();
		worksheets.forEach((worksheet) => {
			utils.book_append_sheet(
				workbook,
				worksheet.worksheet,
				worksheet.sheet_name,
			);
		});
		return workbook;
	};

	const convertListToWorkBook = async (data: Record<string, unknown>[]) =>
		utils.json_to_sheet(data);

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

			const [regularHours = 0, regularMinutes = 0] = (
				entry.Regular?.split(":") ?? []
			).map(Number);

			const [dailyOtHours = 0, dailyOtMinutes = 0] = (
				entry["Daily overtime hours"]?.split(":") ?? []
			).map(Number);

			if (
				!entry["Start Date"] ||
				!entry.In ||
				!entry["End Date"] ||
				!entry.Out
			) {
				return null;
			}

			if (entry.Type === "Unpaid Leave") {
				return null;
			}

			const startTime = moment(`${entry["Start Date"]} ${entry.In}`);
			const endTime = moment(`${entry["End Date"].split(" ")[0]} ${entry.Out}`);
			if (!startTime.isValid() || !endTime.isValid()) {
				notify.warn(`Invalid date/time in entry for ${firstName} ${lastName}`);
				throw new Error("Invalid date/time");
			}

			return {
				"First Name": entry["First name"],
				"Last Name": entry["Last name"],
				"Start Time": startTime,
				"End Time": endTime,
				Regular: regularHours + regularMinutes / 60,
				OT: dailyOtHours + dailyOtMinutes / 60,
				Schedule: entry.Type || "No Schedule",
			};
		});
	};

	/*
	 * Event Handlers
	 */

	const onPayRatesFileInputChange = async (
		files: FileList,
		sheet_name: string,
	) => {
		const file = files?.[0] || null;
		// @ts-expect-error
		const payRatesData: PayRate[] = await proccessXLSXFile(file, sheet_name);
		setPayRatesData(payRatesData);
	};

	const onTimesheetFileInputChange = async (
		files: FileList,
		sheet_name: string,
	) => {
		const file = files?.[0] || null;
		// @ts-expect-error
		const timesheetData: NewInputTimesheetEntry[] = await proccessXLSXFile(
			file,
			sheet_name,
		);

		const originalTimesheetData = convertNewTimeSheetToTimesheetEntrys(
			timesheetData,
		).filter((e): e is OriginalTimesheetEntry => e !== null);

		setTimesheetFilename(file?.name || "");
		setTimesheetData(originalTimesheetData);
	};

	// TODO: Make the wooksheets look good!
	const onDownloadPayroll = async (
		payrollHours: PayrollRow[],
		payrollDollars: PayrollRow[],
		sheet_name_hours: string,
		sheet_name_dollars: string,
		fileSuffix: string,
	) => {
		const payrollHoursWorkSheet = await convertListToWorkBook(payrollHours);
		const payrollDollarsWorkSheet = await convertListToWorkBook(payrollDollars);
		const payrollWorkBook = await worksheetsToWorkBook([
			{ worksheet: payrollHoursWorkSheet, sheet_name: sheet_name_hours },
			{ worksheet: payrollDollarsWorkSheet, sheet_name: sheet_name_dollars },
		]);
		const newFilename = `${timesheetFilename.replace(".xlsx", "")}${fileSuffix}.xlsx`;
		return downloadWorkBook(payrollWorkBook, newFilename);
	};

	return {
		payRatesData,
		onPayRatesFileInputChange,
		timesheetData,
		onTimesheetFileInputChange,
		onDownloadPayroll,
	};
};
