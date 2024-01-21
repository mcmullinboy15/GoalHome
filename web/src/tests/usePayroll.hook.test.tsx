import React from "react";
import fs from "fs/promises";
import { usePayroll } from "../hooks/usePayroll";
import { useFileWorkBookManagment } from "../hooks/useFileWorkBookManagment";
import { useSettings } from "../hooks/useSettings";
import {
  act,
  screen,
  render,
  renderHook,
  fireEvent,
  RenderHookResult,
} from "@testing-library/react";
import { App } from "../App";
import { NotificationProvider } from "../common/notify";

describe("Test Hooks", () => {
  let runPayrollHook: RenderHookResult<ReturnType<typeof usePayroll>, unknown>;
  let fileWoorkBookManagmentHook: RenderHookResult<
    ReturnType<typeof useFileWorkBookManagment>,
    unknown
  >;
  let settingHook: RenderHookResult<ReturnType<typeof useSettings>, unknown>;

  beforeEach(() => {
    runPayrollHook = renderHook(() => usePayroll());
    fileWoorkBookManagmentHook = renderHook(() => useFileWorkBookManagment());
    settingHook = renderHook(() => useSettings());
  });

  test("payroll is run correctly", async () => {
    const payRatesBuffer = await fs.readFile("src/tests/pay-rate.xlsx");
    const payRatesFile = new File([payRatesBuffer], "pay-rates.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const timesheetBuffer = await fs.readFile("src/tests/timesheets.xlsx");
    const timesheetFile = new File([timesheetBuffer], "timesheets.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await act(async () =>
      fileWoorkBookManagmentHook.result.current.onPayRatesFileInputChange(
        // @ts-ignore
        [payRatesFile],
        settingHook.result.current.settings.payRatesSheetName
      )
    );

    await act(async () =>
      fileWoorkBookManagmentHook.result.current.onTimesheetFileInputChange(
        // @ts-ignore
        [timesheetFile],
        settingHook.result.current.settings.timesheetSheetName
      )
    );
    console.log(
      "Pay Rates Data",
      fileWoorkBookManagmentHook.result.current.payRatesData
    );
    await act(async () =>
      runPayrollHook.result.current.runPayroll(
        fileWoorkBookManagmentHook.result.current.payRatesData,
        fileWoorkBookManagmentHook.result.current.timesheetData
      )
    );
    console.log("Pay Roll Data", runPayrollHook.result.current.payrollHours);
  });

  afterAll(() => {
    console.log("Done");
  });
});

describe.skip("Test App", () => {
  let renderedComponent: ReturnType<typeof render>;

  beforeEach(() => {
    renderedComponent = render(
      <React.StrictMode>
        <App />
        <NotificationProvider />
      </React.StrictMode>
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
    fireEvent.change(timesheetFileInput, {
      target: { files: [timesheetFile] },
    });
    const runPayrollButton = screen.getByTestId("run-payroll");
    expect(runPayrollButton).toBeInTheDocument();
    const payrollRan = fireEvent.click(runPayrollButton);
    expect(payrollRan).toBeTruthy();
  });

  afterAll(() => {
    renderedComponent.unmount();
    console.log("Done");
  });
});
