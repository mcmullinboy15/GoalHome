import fs from "fs/promises";
import { read, utils, write } from "xlsx";
import { calculatePayrollHours } from "../context/payroll-logic";
import { settings } from "../utils/settings";
import { timesheetTestDataConverted } from "./timesheet_dec10_dec23_2023";

const GENERATED_OUTPUT_FILE = "payroll-hours.generated.xlsx";

describe("CI payroll function-only test", () => {
	test("calculates payroll hours and round-trips output workbook", async () => {
		await fs.rm(GENERATED_OUTPUT_FILE, { force: true });

		const payrollHours = calculatePayrollHours(timesheetTestDataConverted);
		expect(payrollHours.length).toBeGreaterThan(0);

		const worksheet = utils.json_to_sheet(payrollHours);
		const workbook = utils.book_new();
		utils.book_append_sheet(workbook, worksheet, settings.payrollHoursSheetName);

		const workbookBuffer = write(workbook, { bookType: "xlsx", type: "buffer" });
		await fs.writeFile(GENERATED_OUTPUT_FILE, workbookBuffer);

		const generatedBuffer = await fs.readFile(GENERATED_OUTPUT_FILE);
		const generatedWorkbook = read(generatedBuffer, { type: "buffer" });
		const generatedRows = utils.sheet_to_json(generatedWorkbook.Sheets[settings.payrollHoursSheetName], {
			defval: null,
		});

		expect(generatedRows).toEqual(payrollHours);

		await fs.rm(GENERATED_OUTPUT_FILE, { force: true });
	});
});
