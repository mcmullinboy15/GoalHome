import React, { createContext, useState } from "react";
import { notify } from "../notify";
import type { OriginalTimesheetEntry, PayrollRow } from "../utils/types";
import { calculatePayrollHours, verifyPayrollData } from "./payroll-logic";

type PayrollContextType = {
	hours: PayrollRow[];
	run: (payrollHours: OriginalTimesheetEntry[] | null) => void;
};

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

export const RunPayrollProvider = ({ children }: { children: React.ReactNode }) => {
	const [hours, setHours] = useState<PayrollRow[]>([]);

	const handleRunPayroll = (timesheetData: OriginalTimesheetEntry[] | null) => {
		if (!timesheetData) {
			notify.error("Missing Timesheet Data");
			return [];
		}

		const isValid = verifyPayrollData(timesheetData);
		if (!isValid) {
			return [];
		}

		const hours = calculatePayrollHours(timesheetData);

		setHours(hours);
	};

	return <PayrollContext.Provider value={{ hours, run: handleRunPayroll }}>{children}</PayrollContext.Provider>;
};

export const usePayroll = () => {
	const context = React.useContext(PayrollContext);
	if (context === undefined) {
		throw new Error("usePayroll must be used within a RunPayrollProvider");
	}

	return context;
};
