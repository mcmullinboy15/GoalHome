import { useEffect, useMemo, useState } from "react";
import {
	MaterialReactTable,
	useMaterialReactTable,
	type MRT_ColumnDef,
	type MRT_TableInstance,
	type MRT_Row,
} from "material-react-table";
import { AccessTime, AttachMoney, Download } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import {
	type PayRate,
	PayrollColumns,
	type PayrollRow,
	type OriginalTimesheetEntry,
} from "../utils/types";
import { useFileWorkBookManagment } from "../hooks/useFileWorkBookManagment";
import { usePayroll } from "../hooks/usePayroll";
import { useSettings } from "../hooks/useSettings";
import { notify } from "../notify";

type DiffProps = {
	textColor?: string;
	bgColor?: string;
	value?: number;
};

const Diff = ({
	textColor: _textColor,
	bgColor: _bgColor,
	value: _value,
}: DiffProps) => {
	const [value] = useState(_value ?? 0);
	const [textColor, setTextColor] = useState(_textColor);
	const [bgColor, setBgColor] = useState(_bgColor);

	useEffect(() => {
		if (!textColor) {
			setTextColor(
				value > 0 ? "text-green-700" : value < 0 ? "text-red-700" : textColor,
			);
		}
		if (!bgColor) {
			setBgColor(
				value > 0 ? "bg-green-100" : value < 0 ? "bg-red-100" : bgColor,
			);
		}
	}, [textColor, bgColor, value]);

	if (value === 0) {
		return <></>;
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
	payRatesData: PayRate[] | null;
	timesheetData: OriginalTimesheetEntry[] | null;
};

const DetailPanel = ({
	row,
	table,
	payRatesData,
	timesheetData,
}: DetailPanelProps) => {
	const timesheetRows = useMemo(() => {
		if (!timesheetData) return [];

		return timesheetData.filter(
			(x) =>
				x["First Name"].toUpperCase() ===
					(
						row.getValue(PayrollColumns.FirstName) as PayrollRow["firstName"]
					).toUpperCase() &&
				x["Last Name"].toUpperCase() ===
					(
						row.getValue(PayrollColumns.LastName) as PayrollRow["lastName"]
					).toUpperCase(),
		);
	}, [timesheetData, row]);

	const payRate = useMemo(() => {
		if (!payRatesData) return null;

		return payRatesData.find(
			(x) =>
				x["FIRST"].toUpperCase() ===
					(
						row.getValue(PayrollColumns.FirstName) as PayrollRow["firstName"]
					).toUpperCase() &&
				x["LAST"].toUpperCase() ===
					(
						row.getValue(PayrollColumns.LastName) as PayrollRow["lastName"]
					).toUpperCase(),
		);
	}, [payRatesData, row]);

	return (
		<>
			<table className="w-auto divide-y divide-gray-300">
				<thead>
					<tr>
						<th
							scope="col"
							className="px-4 py-2 text-left text-sm font-semibold text-gray-900 sm:pl-0"
						>
							Day Rate
						</th>
						<th
							scope="col"
							className="px-3 py-2 text-left text-sm font-semibold text-gray-900"
						>
							Night Rate
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-200">
					<tr>
						<td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
							{payRate ? payRate["Day Rate"] : "N/A"}
						</td>
						<td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
							{payRate ? payRate["Night Rate"] : "N/A"}
						</td>
					</tr>
				</tbody>
			</table>

			<table className="w-auto divide-y divide-gray-300">
				<thead>
					<tr>
						<th
							scope="col"
							className="px-4 py-2 text-left text-sm font-semibold text-gray-900 sm:pl-0"
						>
							Date
						</th>
						<th
							scope="col"
							className="px-3 py-2 text-left text-sm font-semibold text-gray-900"
						>
							Start
						</th>
						<th
							scope="col"
							className="px-3 py-2 text-left text-sm font-semibold text-gray-900"
						>
							End
						</th>
						<th
							scope="col"
							className="px-3 py-2 text-left text-sm font-semibold text-gray-900"
						>
							Regular
						</th>
						<th
							scope="col"
							className="px-3 py-2 text-left text-sm font-semibold text-gray-900"
						>
							OT
						</th>
						<th
							scope="col"
							className="px-3 py-2 text-left text-sm font-semibold text-gray-900"
						>
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
							<td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
								{shift["End Time"].format("hh:mm A")}
							</td>
							<td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
								{!shift["Regular"] ? "-" : shift["Regular"]}
							</td>
							<td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
								{!shift["OT"] ? "-" : shift["OT"]}
							</td>
							<td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
								{shift["Schedule"]}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</>
	);
};

export const Results = () => {
	const [tableToggle, setTableToggle] = useState(true);
	const { payrollHours, payrollDollars } = usePayroll();
	const { payRatesData, timesheetData, onDownloadPayroll } =
		useFileWorkBookManagment();
	const { settings } = useSettings();

	const handleDownload = () => {
		if (payrollHours.length === 0) {
			notify.error("No payroll data to download");
			return;
		}

		return onDownloadPayroll(
			payrollHours,
			payrollDollars,
			settings.payrollHoursSheetName,
			settings.payrollPaySheetName,
			settings.payrollSuffix,
		);
	};

	// Define columns

	// TODO:
	// accessorFn: (row) => row[PayrollColumns.Day].toLocaleString('en-US', {
	//   style: 'currency',
	//   currency: 'USD',
	// }),
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
		];

		if (tableToggle) {
			x.push(
				{
					accessorKey: PayrollColumns.DiffRegular,
					header: "Diff Regular",
					accessorFn: (row) => <Diff value={row[PayrollColumns.DiffRegular]} />,
				},
				{
					accessorKey: PayrollColumns.DiffOT,
					header: "Diff OT",
					accessorFn: (row) => <Diff value={row[PayrollColumns.DiffOT]} />,
				},
				{
					accessorKey: PayrollColumns.DiffTotal,
					header: "Diff Total",
					accessorFn: (row) => <Diff value={row[PayrollColumns.DiffTotal]} />,
				},
				{
					accessorKey: PayrollColumns.DiffFix,
					header: "To Fix",
					accessorFn: (row) => {
						if (
							(row[PayrollColumns.DiffRegular] ?? 0) < 0 &&
							(row[PayrollColumns.DiffOT] ?? 0) > 0
						) {
							// Regular is negative and OT is positive
							// Therefore the person is missing regular hours or they are in OT
							// So add more to regular hours. just in case let's not add more to OT hours
							return (
								<span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-600/10">
									Add
									<span className="font-bold text-blue-500 mx-1">
										{Math.abs(row[PayrollColumns.DiffRegular] ?? 0)}
									</span>
									To
									<span className="font-bold text-blue-500 ml-1">Reg</span>
								</span>
							);
						} else if (
							(row[PayrollColumns.DiffRegular] ?? 0) > 0 &&
							(row[PayrollColumns.DiffOT] ?? 0) < 0
						) {
							// Regular is positive and OT is negative
							// Therefore the person is missing regular hours or they are in OT
							// So add more to regular hours. just in case let's not add more to OT hours
							return (
								<>
									<span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-600/10">
										Sub
										<span className="font-bold text-blue-500 mx-1">
											{Math.abs(row[PayrollColumns.DiffRegular] ?? 0)}
										</span>
										From
										<span className="font-bold text-blue-500 mx-1">Reg</span>
										(80hrs Max)
									</span>

									<span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-600/10">
										Add
										<span className="font-bold text-blue-500 mx-1">
											{Math.abs(row[PayrollColumns.DiffOT] ?? 0)}
										</span>
										To
										<span className="font-bold text-blue-500 ml-1">OT</span>
									</span>
								</>
							);
						} else if ((row[PayrollColumns.DiffRegular] ?? 0) < 0) {
							// Regular is negative and OT is 0
							// Therefore the person is missing regular hours
							// So add more to regular hours.
							return (
								<span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-600/10">
									Add
									<span className="font-bold text-blue-500 mx-1">
										{Math.abs(row[PayrollColumns.DiffRegular] ?? 0)}
									</span>
									To
									<span className="font-bold text-blue-500 ml-1">Reg</span>
								</span>
							);
						} else if ((row[PayrollColumns.DiffOT] ?? 0) < 0) {
							// OT is negative and Regular is 0
							// Therefore the person is missing OT hours
							// So add more to OT hours.
							return (
								<span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-600/10">
									Add
									<span className="font-bold text-blue-500 mx-1">
										{Math.abs(row[PayrollColumns.DiffOT] ?? 0)}
									</span>
									To
									<span className="font-bold text-blue-500 ml-1">OT</span>
								</span>
							);
						}
					},
				},
			);
		}

		return x.map((col) => ({
			...col,
			accessorFn:
				col.accessorFn ??
				((row) =>
					row[col.accessorKey as keyof PayrollRow] === 0
						? "-"
						: row[col.accessorKey as keyof PayrollRow]),
		}));
	}, [tableToggle]);

	//pass table options to useMaterialReactTable
	const table = useMaterialReactTable({
		columns,
		data: tableToggle ? payrollHours : payrollDollars,
		rowCount: (tableToggle ? payrollHours : payrollDollars).length,
		enableColumnOrdering: true,
		enableHiding: true,
		enablePagination: false,
		enableDensityToggle: false,
		enableColumnDragging: false,
		enableBottomToolbar: false,
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
						<IconButton
							disabled={!(tableToggle ? payrollHours : payrollDollars).length}
							onClick={handleDownload}
						>
							<Download
								className={
									!(tableToggle ? payrollHours : payrollDollars).length
										? ""
										: "text-blue-500"
								}
							/>
						</IconButton>
					</span>
				</Tooltip>

				<Tooltip title={tableToggle ? "Toggle to Pay" : "Toggle to Hours"}>
					<IconButton onClick={() => setTableToggle(!tableToggle)}>
						{tableToggle ? <AttachMoney /> : <AccessTime />}
					</IconButton>
				</Tooltip>
			</div>
		),
		muiTablePaperProps: {
			elevation: 0,
		},
		muiTableBodyProps: {
			sx: (theme) => ({
				[tableToggle ? "& > tr:nth-of-type(4n+1)" : "& tr:nth-of-type(2n+1)"]: {
					backgroundColor: "#eee !important",
				},
			}),
		},
		renderDetailPanel: !tableToggle
			? undefined
			: ({ row, table }) => (
					<DetailPanel
						row={row}
						table={table}
						payRatesData={payRatesData}
						timesheetData={timesheetData}
					/>
				),
	});

	return <MaterialReactTable table={table} />;
};
