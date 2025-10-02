import { createContext, useMemo, useState } from "react";
import { PayRate, OriginalTimesheetEntry } from "../utils/types";

export type FileWorkBookManagmentType = {
  payRatesData: PayRate[] | null;
  setPayRatesData: (payRatesData: PayRate[] | null) => void;
  timesheetData: OriginalTimesheetEntry[] | null;
  setTimesheetData: (timesheetData: OriginalTimesheetEntry[] | null) => void;
  timesheetFilename: string;
  setTimesheetFilename: (timesheetFilename: string) => void;
};

const FileWorkBookContext = createContext<
  FileWorkBookManagmentType | undefined
>(undefined);

const FileWorkBookProvider = ({ children }: any): any => {
  const [payRatesData, setPayRatesData] = useState<PayRate[] | null>(null);
  const [timesheetData, setTimesheetData] = useState<
    OriginalTimesheetEntry[] | null
  >(null);
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
    [payRatesData, timesheetData, timesheetFilename]
  );

  return (
    <FileWorkBookContext.Provider value={data}>
      {children}
    </FileWorkBookContext.Provider>
  );
};

export { FileWorkBookProvider, FileWorkBookContext };
