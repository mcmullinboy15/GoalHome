import { CheckCircle, CloudDone, RunCircle } from "@mui/icons-material";
import { Button } from "../components";
import { DragAndDropFile } from "../components/DragAndDropFile";
import { useFileWorkBookManagment } from "../hooks/useFileWorkBookManagment";
import { usePayroll } from "../hooks/usePayroll";
import { useSettings } from "../hooks/useSettings";
import { Results } from "./Results";

export const Home = () => {
	// Settings
	const { settings } = useSettings();

	// File WorkBook Handling
	const {
		payRatesData,
		onPayRatesFileInputChange,
		timesheetData,
		onTimesheetFileInputChange,
	} = useFileWorkBookManagment();

	// Payroll
	const { runPayroll } = usePayroll();

	const isReady = timesheetData;

	return (
		<main className="h-full border-t-2">
			<div className="w-full flex flex-row flex-wrap gap-x-4  *:flex *:flex-row *:flex-grow *:justify-center *:items-center *:gap-x-4 *:my-2">
				<div>
					<h1 className="text-3xl font-bold font-mono text-gray-400 whitespace-nowrap">
						Pay Rates
					</h1>
					<DragAndDropFile
						dense
						label={
							<>
								<CloudDone
									className={
										payRatesData ? "text-green-400 mr-2" : "text-gray-400 mr-2"
									}
								/>
								{payRatesData ? "File Uploaded!" : "Upload File"}
							</>
						}
						name="pay-rates"
						onInput={(files: FileList) =>
							onPayRatesFileInputChange(files, settings.payRatesSheetName)
						}
						accept=".xlsx"
						isLoaded={payRatesData !== null}
					/>
				</div>

				<div>
					<h1 className="text-3xl font-bold font-mono text-gray-400 whitespace-nowrap">
						Timesheet
					</h1>
					<DragAndDropFile
						dense
						label={
							<>
								<CheckCircle
									className={
										timesheetData ? "text-green-400 mr-2" : "text-gray-400 mr-2"
									}
								/>
								{timesheetData ? "File Uploaded!" : "Upload File"}
							</>
						}
						name="timesheet"
						onInput={(files: FileList) => {
							onTimesheetFileInputChange(files, settings.timesheetSheetName);
						}}
						accept=".xlsx"
						isLoaded={timesheetData !== null}
					/>
				</div>

				<div>
					<h1 className="text-3xl font-bold font-mono text-gray-400 whitespace-nowrap">
						Run Payroll
					</h1>
					<Button
						name="run-payroll"
						variant={isReady ? "text" : "contained"}
						className="py-2 px-6"
						onClick={() => runPayroll(payRatesData, timesheetData)}
						disabled={!isReady}
					>
						<RunCircle
							className={
								isReady ? "text-green-400 w-4 h-4" : "text-gray-400 w-4 h-4"
							}
						/>
					</Button>
				</div>

				<div className="rounded-br-lg !h-full !w-full px-2 border-t-2 !my-0">
					<Results />
				</div>
			</div>
		</main>
	);
};
