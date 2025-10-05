/** biome-ignore-all lint/correctness/noNestedComponentDefinitions: Just need it for the column Cells */

import { Download } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import {
	MaterialReactTable,
	type MRT_ColumnDef,
	type MRT_Row,
	type MRT_TableInstance,
	useMaterialReactTable,
} from "material-react-table";
import { useEffect, useMemo, useState } from "react";
import { usePayroll } from "../context/payroll";
import { useFileWorkBook } from "../hooks/useFileWorkBookManagment";
import { notify } from "../notify";
import { settings } from "../utils/settings";
import { type OriginalTimesheetEntry, PayrollColumns, type PayrollRow } from "../utils/types";

type DiffProps = {
	textColor?: string;
	bgColor?: string;
	value?: number;
};

const Diff = (props: DiffProps) => {
	const [value] = useState(props.value && !Number.isNaN(props.value) ? props.value : 0);
	const [textColor, setTextColor] = useState(props.textColor);
	const [bgColor, setBgColor] = useState(props.bgColor);

	useEffect(() => {
		if (!textColor) {
			setTextColor(value > 0 ? "text-green-700" : value < 0 ? "text-red-700" : textColor);
		}
		if (!bgColor) {
			setBgColor(value > 0 ? "bg-green-100" : value < 0 ? "bg-red-100" : bgColor);
		}
	}, [textColor, bgColor, value]);

	if (value === 0) {
		return <span className="text-gray-400">-</span>;
	}

	return (
		<span
			className={
				"inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-600/10 " +
				bgColor +
				" " +
				textColor
			}
		>
			{value}
		</span>
	);
};

type DetailPanelProps = {
	row: MRT_Row<PayrollRow>;
	table: MRT_TableInstance<PayrollRow>;
	timesheetData: OriginalTimesheetEntry[] | null;
};

const DetailPanel = ({ row, timesheetData }: DetailPanelProps) => {
	const timesheetRows = useMemo(() => {
		if (!timesheetData) {
			return [];
		}

		const predicate = (x: OriginalTimesheetEntry) =>
			x["First Name"].toUpperCase() === row.original[PayrollColumns.FirstName].toUpperCase() &&
			x["Last Name"].toUpperCase() === row.original[PayrollColumns.LastName].toUpperCase();

		return timesheetData.filter(predicate);
	}, [timesheetData, row]);

	return (
		<table className="w-auto divide-y divide-gray-300">
			<thead>
				<tr>
					<th scope="col" className="px-4 py-2 text-left text-sm font-semibold text-gray-900 sm:pl-0">
						Date
					</th>
					<th scope="col" className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
						Start
					</th>
					<th scope="col" className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
						End
					</th>
					<th scope="col" className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
						Regular
					</th>
					<th scope="col" className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
						OT
					</th>
					<th scope="col" className="px-3 py-2 text-left text-sm font-semibold text-gray-900">
						Schedule
					</th>
				</tr>
			</thead>
			<tbody className="divide-y divide-gray-200">
				{timesheetRows.map((shift, index) => (
					<tr key={`${shift["First Name"]} ${index}`}>
						<td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900 sm:pl-0">
							{shift["Start Time"].format("MM/DD/YYYY")}
						</td>
						<td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
							{shift["Start Time"].format("hh:mm A")}
						</td>
						<td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">{shift["End Time"].format("hh:mm A")}</td>
						<td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">{shift.Regular ?? "-"}</td>
						<td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">{shift.OT ?? "-"}</td>
						<td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">{shift.Schedule}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};

export const Results = () => {
	const { hours } = usePayroll();
	const { timesheetData, onDownloadPayroll } = useFileWorkBook();

	const handleDownload = () => {
		if (hours.length === 0) {
			notify.error("No payroll data to download");
			return;
		}

		return onDownloadPayroll(hours, settings.payrollHoursSheetName, settings.payrollSuffix);
	};

	// Define columns
	const columns = useMemo((): MRT_ColumnDef<PayrollRow>[] => {
		const x: MRT_ColumnDef<PayrollRow>[] = [
			{
				accessorKey: PayrollColumns.LastName,
				header: "Last Name",
				enableHiding: false,
			},
			{
				accessorKey: PayrollColumns.FirstName,
				header: "First Name",
				enableHiding: false,
			},
			{
				accessorKey: PayrollColumns.Day,
				header: "Day",
			},
			{
				accessorKey: PayrollColumns.Night,
				header: "Night",
			},
			{
				accessorKey: PayrollColumns.PaddingtonNight,
				header: "Paddington Night",
			},
			{
				accessorKey: PayrollColumns.NightOT,
				header: "Night OT",
			},
			{
				accessorKey: PayrollColumns.PaddingtonNightOT,
				header: "Paddington Night OT",
			},
			{
				accessorKey: PayrollColumns.DayOT,
				header: "Day OT",
			},
			{
				accessorKey: PayrollColumns.PaddingtonDayOT,
				header: "Paddington Day OT",
			},
			{
				accessorKey: PayrollColumns.PaddingtonDay,
				header: "Paddington Day",
			},
			{
				accessorKey: PayrollColumns.TotalRegular,
				header: "Total Regular",
			},
			{
				accessorKey: PayrollColumns.TotalOT,
				header: "Total OT",
			},
			{
				accessorKey: PayrollColumns.TotalHours,
				header: "Total Hours",
			},
			{
				accessorKey: PayrollColumns.DiffRegular,
				header: "Diff Regular",
				Cell: ({ row }) => <Diff value={row.original[PayrollColumns.DiffRegular]} />,
			},
			{
				accessorKey: PayrollColumns.DiffOT,
				header: "Diff OT",
				Cell: ({ row }) => <Diff value={row.original[PayrollColumns.DiffOT]} />,
			},
			{
				accessorKey: PayrollColumns.DiffTotal,
				header: "Diff Total",
				Cell: ({ row }) => <Diff value={row.original[PayrollColumns.DiffTotal]} />,
			},
		];

		return x.map((col) => {
			col.Cell =
				col.Cell ??
				(({ cell }) => {
					const num = cell.getValue<number>();
					return !num || Number.isNaN(num) || num === 0 ? "-" : num;
				});
			return col;
		});
	}, []);

	// Pass table options to useMaterialReactTable
	const table = useMaterialReactTable({
		columns,
		data: hours,
		rowCount: hours.length,
		enableColumnOrdering: true,
		enableHiding: true,
		enablePagination: false,
		enableDensityToggle: false,
		enableColumnDragging: false,
		enableBottomToolbar: false,
		renderFallbackValue: () => "-",
		defaultColumn: { size: 80 },
		initialState: {
			pagination: { pageIndex: 0, pageSize: 100 },
			density: "compact",
			sorting: [{ id: PayrollColumns.LastName, desc: false }],
			columnVisibility: { [PayrollColumns.TotalRegular]: false },
		},
		renderTopToolbarCustomActions: () => (
			<div className="flex">
				<Tooltip title="Download Payroll (.xlsx)">
					<span>
						<IconButton disabled={!hours.length} onClick={handleDownload}>
							<Download className={!hours.length ? "" : "text-blue-500"} />
						</IconButton>
					</span>
				</Tooltip>
			</div>
		),
		muiTablePaperProps: {
			elevation: 0,
		},
		muiTableBodyProps: {
			sx: () => ({
				"& > tr:nth-of-type(4n+1)": {
					backgroundColor: "#eee !important",
				},
			}),
		},
		renderDetailPanel: ({ row, table }) => <DetailPanel row={row} table={table} timesheetData={timesheetData} />,
	});

	return <MaterialReactTable table={table} />;
};
