import { act, fireEvent, type RenderHookResult, render, renderHook, screen } from "@testing-library/react";
import fs from "fs/promises";
import React from "react";
import { App } from "../App";
import { NotificationProvider } from "../common/notify";
import { usePayroll } from "../context/payroll";
import { useFileWorkBook } from "../hooks/useFileWorkBookManagment";
import { settings } from "../utils/settings";

describe("Test Hooks", () => {
	let runPayrollHook: RenderHookResult<ReturnType<typeof usePayroll>, unknown>;
	let fileWoorkBookManagmentHook: RenderHookResult<ReturnType<typeof useFileWorkBook>, unknown>;

	beforeEach(() => {
		runPayrollHook = renderHook(() => usePayroll());
		fileWoorkBookManagmentHook = renderHook(() => useFileWorkBook());
	});

	test("payroll is run correctly", async () => {
		const timesheetBuffer = await fs.readFile("src/tests/timesheets.xlsx");
		const timesheetFile = new File([timesheetBuffer], "timesheets.xlsx", {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});

		await act(async () =>
			fileWoorkBookManagmentHook.result.current.onTimesheetFileInputChange(
				[timesheetFile],
				settings.timesheetSheetName,
			),
		);

		await act(async () => runPayrollHook.result.current.run(fileWoorkBookManagmentHook.result.current.timesheetData));
	});
});

describe.skip("Test App", () => {
	let renderedComponent: ReturnType<typeof render>;

	beforeEach(() => {
		renderedComponent = render(
			<React.StrictMode>
				<App />
				<NotificationProvider />
			</React.StrictMode>,
		);
	});

	test("payroll in the document", async () => {
		const payRatesBuffer = await fs.readFile("src/tests/pay-rate.xlsx");
		const payRatesFile = new File([payRatesBuffer], "pay-rates.xlsx", {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});
		const timesheetBuffer = await fs.readFile("src/tests/timesheets.xlsx");
		const timesheetFile = new File([timesheetBuffer], "timesheets.xlsx", {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});

		const payRatesFileInput = screen.getByTestId("pay-rates");
		expect(payRatesFileInput).toBeInTheDocument();
		fireEvent.change(payRatesFileInput, { target: { files: [payRatesFile] } });

		const timesheetFileInput = screen.getByTestId("timesheet");
		expect(timesheetFileInput).toBeInTheDocument();
		fireEvent.change(timesheetFileInput, { target: { files: [timesheetFile] } });

		const runPayrollButton = screen.getByTestId("run-payroll");
		expect(runPayrollButton).toBeInTheDocument();

		const payrollRan = fireEvent.click(runPayrollButton);
		expect(payrollRan).toBeTruthy();
	});

	afterAll(() => {
		renderedComponent.unmount();
	});
});
