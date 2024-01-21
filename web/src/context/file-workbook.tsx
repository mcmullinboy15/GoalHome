import { createContext, useMemo, useState } from "react";
import { PayRate, TimesheetEntry } from "../utils/types";

export type FileWorkBookManagmentType = {
  payRatesData: PayRate[] | null;
  setPayRatesData: (payRatesData: PayRate[] | null) => void;
  timesheetData: TimesheetEntry[] | null;
  setTimesheetData: (timesheetData: TimesheetEntry[] | null) => void;
  timesheetFilename: string;
  setTimesheetFilename: (timesheetFilename: string) => void;
};

const FileWorkBookContext = createContext<FileWorkBookManagmentType>({
  payRatesData: [],
  setPayRatesData: () => {},
  timesheetData: [],
  setTimesheetData: () => {},
  timesheetFilename: "",
  setTimesheetFilename: () => {},
});

const FileWorkBookProvider = ({ children }: any): any => {
  const [payRatesData, setPayRatesData] = useState<PayRate[] | null>(null);
  const [timesheetData, setTimesheetData] = useState<TimesheetEntry[] | null>(
    null
  );
  const [timesheetFilename, setTimesheetFilename] = useState<string>("");

  const data = useMemo(
    () => ({
      payRatesData,
      setPayRatesData,
      timesheetData,
      setTimesheetData,
      timesheetFilename,
      setTimesheetFilename,
    }),
    [payRatesData, timesheetData]
  );

  return (
    <FileWorkBookContext.Provider value={data}>
      {children}
    </FileWorkBookContext.Provider>
  );
};

export { FileWorkBookProvider, FileWorkBookContext };
