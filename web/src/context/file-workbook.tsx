import type React from "react";
import { createContext, useContext, useState } from "react";
import type { OriginalTimesheetEntry } from "../utils/types";

type ContextType = {
	timesheetData: OriginalTimesheetEntry[] | null;
	setTimesheetData: (timesheetData: OriginalTimesheetEntry[] | null) => void;
	timesheetFilename: string;
	setTimesheetFilename: (timesheetFilename: string) => void;
};

const FileWorkBookContext = createContext<ContextType | undefined>(undefined);

export const FileWorkBookProvider = ({ children }: { children: React.ReactNode }) => {
	const [timesheetData, setTimesheetData] = useState<OriginalTimesheetEntry[] | null>(null);
	const [timesheetFilename, setTimesheetFilename] = useState<string>("");

	return (
		<FileWorkBookContext.Provider value={{ timesheetData, setTimesheetData, timesheetFilename, setTimesheetFilename }}>
			{children}
		</FileWorkBookContext.Provider>
	);
};

export const useFileWorkBookManagment = () => {
	const context = useContext(FileWorkBookContext);
	if (context === undefined) {
		throw new Error("useFileWorkBookManagment must be used within a FileWorkBookProvider");
	}

	return context;
};
