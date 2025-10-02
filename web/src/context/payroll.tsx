import { createContext, useMemo, useState } from "react";
import type { PayrollRow } from "../utils/types";

type PayrollContextType = {
	payrollHours: PayrollRow[];
	payrollDollars: PayrollRow[];
	setPayrollHours: (payrollHours: PayrollRow[]) => void;
	setPayrollDollars: (payrollDollars: PayrollRow[]) => void;
};

const PayrollContext = createContext<PayrollContextType>({
	payrollHours: [],
	payrollDollars: [],
	setPayrollHours: () => {},
	setPayrollDollars: () => {},
});

const RunPayrollProvider = ({ children }: any): any => {
	const [payrollHours, setPayrollHours] = useState<PayrollRow[]>([]);
	const [payrollDollars, setPayrollDollars] = useState<PayrollRow[]>([]);

	const data = useMemo(
		() => ({
			payrollHours,
			payrollDollars,
			setPayrollHours,
			setPayrollDollars,
		}),
		[payrollHours, payrollDollars],
	);

	return (
		<PayrollContext.Provider value={data}>{children}</PayrollContext.Provider>
	);
};

export { RunPayrollProvider, PayrollContext };
