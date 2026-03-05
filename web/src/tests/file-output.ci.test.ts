import fs from "fs/promises";
import path from "path";
import { read, utils, write } from "xlsx";
import { calculatePayrollHours } from "../context/payroll-logic";
import { convertNewTimeSheetToTimesheetEntrys } from "../hooks/useFileWorkBookManagment";
import { settings } from "../utils/settings";
import type { NewInputTimesheetEntry, OriginalTimesheetEntry } from "../utils/types";
import { format } from "../utils/utils";

const INPUT_FILE = path.join(__dirname, "Quickbooks_report_2026-02-15_2026-02-28.xlsx");
const EXPECTED_OUTPUT_FILE = path.join(__dirname, "Quickbooks_report_2026-02-15_2026-02-28 - Payroll.xlsx");

describe("CI payroll function-only test", () => {
	test("processes Quickbooks report and matches expected output", async () => {
		const inputBuffer = await fs.readFile(INPUT_FILE);
		const inputWorkbook = read(inputBuffer, {
			type: "buffer",
			cellDates: true,
			cellNF: false,
			cellText: false,
		});

		const timesheetData = utils.sheet_to_json(inputWorkbook.Sheets[settings.timesheetSheetName], {
			raw: false,
			dateNF: format,
			defval: null,
		}) as NewInputTimesheetEntry[];

		const originalTimesheetData = convertNewTimeSheetToTimesheetEntrys(timesheetData).filter(
			(e): e is OriginalTimesheetEntry => e !== null,
		);

		const payrollHours = calculatePayrollHours(originalTimesheetData);
		expect(payrollHours.length).toBeGreaterThan(0);

		const worksheet = utils.json_to_sheet(payrollHours);
		const workbook = utils.book_new();
		utils.book_append_sheet(workbook, worksheet, settings.payrollHoursSheetName);

		const generatedBuffer = write(workbook, { bookType: "xlsx", type: "buffer" });

		const expectedBuffer = await fs.readFile(EXPECTED_OUTPUT_FILE);
		const expectedWorkbook = read(expectedBuffer, { type: "buffer" });
		const expectedRows = utils.sheet_to_json(expectedWorkbook.Sheets[settings.payrollHoursSheetName], {
			defval: null,
		});

		const generatedWorkbook = read(generatedBuffer, { type: "buffer" });
		const generatedRows = utils.sheet_to_json(generatedWorkbook.Sheets[settings.payrollHoursSheetName], {
			defval: null,
		});

		expect(generatedRows).toEqual(expectedRows);
	});
});
