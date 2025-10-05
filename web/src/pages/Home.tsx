import { CheckCircle, RunCircle } from "@mui/icons-material";
import { Button } from "../components";
import { DragAndDropFile } from "../components/DragAndDropFile";
import { usePayroll } from "../context/payroll";
import { useFileWorkBook } from "../hooks/useFileWorkBookManagment";
import { settings } from "../utils/settings";
import { Results } from "./Results";

export const Home = () => {
	const { timesheetData, onTimesheetFileInputChange } = useFileWorkBook();

	const { run } = usePayroll();

	return (
		<main className="h-full">
			<div className="flex justify-end gap-x-4 py-2 px-4">
				<h1 className="text-3xl font-bold font-mono text-gray-400 whitespace-nowrap">Timesheet</h1>
				<DragAndDropFile
					dense
					label={
						<>
							<CheckCircle className={timesheetData ? "text-green-400 mr-2" : "text-gray-400 mr-2"} />
							{timesheetData ? "File Uploaded!" : "Upload File"}
						</>
					}
					name="timesheet"
					onInput={(files: File[]) => onTimesheetFileInputChange(files, settings.timesheetSheetName)}
					accept=".xlsx"
					isLoaded={timesheetData !== null}
				/>

				<h1 className="text-3xl font-bold font-mono text-gray-400 whitespace-nowrap">Run Payroll</h1>
				<Button
					name="run-payroll"
					variant={timesheetData ? "text" : "contained"}
					className="py-2 px-6"
					onClick={() => run(timesheetData)}
					disabled={!timesheetData}
				>
					<RunCircle className={timesheetData ? "text-green-400 w-4 h-4" : "text-gray-400 w-4 h-4"} />
				</Button>
			</div>

			<div className="rounded-br-lg !h-full !w-full px-2 border-t-2 !my-0">
				<Results />
			</div>
		</main>
	);
};
