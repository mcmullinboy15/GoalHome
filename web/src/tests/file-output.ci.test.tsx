import { act, renderHook, waitFor } from "@testing-library/react";
import fs from "fs/promises";
import React from "react";
import { read, utils } from "xlsx";
import { FileWorkBookProvider } from "../context/file-workbook";
import { RunPayrollProvider, usePayroll } from "../context/payroll";
import { useFileWorkBook } from "../hooks/useFileWorkBookManagment";
import { settings } from "../utils/settings";
import { timesheetTestDataConverted } from "./timesheet_dec10_dec23_2023";

const GENERATED_OUTPUT_FILE = " - Payroll.xlsx";

const wrapper = ({ children }: { children: React.ReactNode }) => (
	<React.StrictMode>
		<FileWorkBookProvider>
			<RunPayrollProvider>{children}</RunPayrollProvider>
		</FileWorkBookProvider>
	</React.StrictMode>
);

describe("CI payroll end-to-end unit test", () => {
	test("runs RunPayroll and writes payroll output file", async () => {
		await fs.rm(GENERATED_OUTPUT_FILE, { force: true });

		const appHooks = renderHook(() => ({ fileWorkBook: useFileWorkBook(), payroll: usePayroll() }), { wrapper });

		await act(async () => {
			appHooks.result.current.payroll.run(timesheetTestDataConverted);
		});

		await waitFor(() => {
			expect(appHooks.result.current.payroll.hours.length).toBeGreaterThan(0);
		});

		await act(async () => {
			await appHooks.result.current.fileWorkBook.onDownloadPayroll(
				appHooks.result.current.payroll.hours,
				settings.payrollHoursSheetName,
				settings.payrollSuffix,
			);
		});

		const generatedFileBuffer = await fs.readFile(GENERATED_OUTPUT_FILE);
		const generatedWorkbook = read(generatedFileBuffer, { type: "buffer" });
		const generatedRows = utils.sheet_to_json(generatedWorkbook.Sheets[settings.payrollHoursSheetName], {
			defval: null,
		});

		expect(generatedRows.length).toBe(appHooks.result.current.payroll.hours.length);
		expect(generatedRows[0]).toMatchObject({
			firstName: expect.any(String),
			lastName: expect.any(String),
			total: expect.any(Number),
		});

		await fs.rm(GENERATED_OUTPUT_FILE, { force: true });
	});
});
