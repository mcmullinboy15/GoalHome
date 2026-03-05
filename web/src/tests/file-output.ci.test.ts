import fs from "fs/promises";
import moment from "moment";
import { read, utils } from "xlsx";
import { calculatePayrollHours } from "../context/payroll-logic";
import { settings } from "../utils/settings";
import type { NewInputTimesheetEntry, OriginalTimesheetEntry, PayrollRow } from "../utils/types";
import { format } from "../utils/utils";

const INPUT_FILE = "src/tests/ci-input.xlsx";
const OUTPUT_FILE = "src/tests/ci-output.json";

const convertNewTimeSheetToTimesheetEntrys = (
	timesheetData: NewInputTimesheetEntry[],
): (OriginalTimesheetEntry | null)[] => {
	return timesheetData.map((entry) => {
		if (entry.Job === "Unpaid Leave") {
			return null;
		}

		if (!entry["Start Date"] || !entry["Start time"] || !entry["End Date"] || !entry["End time"]) {
			return null;
		}

		const [regularHours = 0, regularMinutes = 0] = (entry.Regular?.split(":") ?? []).map(Number);
		const [dailyOtHours = 0, dailyOtMinutes = 0] = (entry["Daily overtime hours"]?.split(":") ?? []).map(Number);

		const start = moment(`${entry["Start Date"]} ${entry["Start time"]}`, "MM/DD/YYYY hh:mm A", true);
		const end = moment(`${entry["End Date"]} ${entry["End time"]}`, "MM/DD/YYYY hh:mm A", true);

		if (!start.isValid() || !end.isValid()) {
			throw new Error("Invalid date/time in ci-input.xlsx");
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

describe("CI payroll file comparison", () => {
	test("generated output matches expected output file", async () => {
		const workbookBuffer = await fs.readFile(INPUT_FILE);
		const expectedOutputContent = await fs.readFile(OUTPUT_FILE, "utf8");

		const workbook = read(workbookBuffer, { type: "buffer", cellDates: true, cellNF: false, cellText: false });
		const inputRows = utils.sheet_to_json(workbook.Sheets[settings.timesheetSheetName], {
			raw: false,
			dateNF: format,
			defval: null,
		}) as NewInputTimesheetEntry[];

		const convertedRows = convertNewTimeSheetToTimesheetEntrys(inputRows).filter(
			(entry): entry is OriginalTimesheetEntry => entry !== null,
		);
		const expectedRows = JSON.parse(expectedOutputContent) as PayrollRow[];

		const generatedRows = calculatePayrollHours(convertedRows);

		expect(generatedRows).toEqual(expectedRows);
	});
});
