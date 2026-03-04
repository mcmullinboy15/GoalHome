import fs from "fs/promises";
import { calculatePayrollHours } from "../context/payroll-logic";
import type { OriginalTimesheetEntry, PayrollRow } from "../utils/types";

const INPUT_FILE = "src/tests/ci-input.json";
const OUTPUT_FILE = "src/tests/ci-output.json";

describe("CI payroll file comparison", () => {
	test("generated output matches expected output file", async () => {
		const inputContent = await fs.readFile(INPUT_FILE, "utf8");
		const expectedOutputContent = await fs.readFile(OUTPUT_FILE, "utf8");

		const inputRows = JSON.parse(inputContent) as OriginalTimesheetEntry[];
		const expectedRows = JSON.parse(expectedOutputContent) as PayrollRow[];

		const generatedRows = calculatePayrollHours(inputRows);

		expect(generatedRows).toEqual(expectedRows);
	});
});
