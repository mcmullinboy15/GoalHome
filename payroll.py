import os
import math
import pytz
import typing
import pathlib
import argparse
import numpy as np
import pandas as pd
pd.set_option('display.max_columns', None)
# pd.set_option('display.max_rows', None)
from datetime import datetime, timedelta, date, time


cd = pathlib.Path(os.path.dirname(os.path.realpath(__file__)))
files = os.listdir(cd)
excel_files = list(filter(lambda x: not x.startswith("~") and x.endswith(".xlsx"), files))


def parse_args():
    parser = argparse.ArgumentParser()


    parser.add_argument("--timesheet", type=str) #, choices=excel_files)
    parser.add_argument("--timesheet-sheet-name", type=str, default="Entries")

    parser.add_argument("--output-tag", type=str, default=" - Payroll")
    parser.add_argument("--output-sheet-name", type=str, default="Payroll")

    parser.add_argument("--pay-rate-file", type=str, default="Pay Rate.xlsx")
    parser.add_argument("--pay-rate-sheet-name", type=str, default="Pay Rate")

    parser.add_argument("--verify-pay-rates",  action="store_true")
    parser.add_argument("--verify-output",     action="store_true")

    parser.add_argument("-v", "--verbose", action="store_true")
    return parser.parse_args()

def p(x, prefix=None, func=lambda x: x, dont=False):
    if prefix: print(prefix)
    print(func(x))
    if not dont: input("...")
    return x

def floor(x):
    return math.floor(x * 100) / 100

def _main(args):

    if args.verbose:
        print(args)


    sheet: pd.DataFrame = pd.read_excel(cd / args.timesheet, sheet_name=args.timesheet_sheet_name, parse_dates=["Date", "Start Time", "End Time"], usecols=["First Name", "Last Name", "Date", "Start Time", "End Time", "Regular", "Schedule", "OT"])
    pay_rates = pd.read_excel(cd / args.pay_rate_file, sheet_name=args.pay_rate_sheet_name)
    if args.verify_pay_rates: 
        print(pay_rates.to_string(index=True))
        return


    # Uppercase ["Last Name", "First Name"]
    sheet["Last Name"] = sheet["Last Name"].str.upper()
    sheet["First Name"] = sheet["First Name"].str.upper()


    # Sort Sheet by Date
    sheet.sort_values(by=["Date"], inplace=True)


    def person_to_minutes(person):
        sum_regular = 0


        start_times = pd.to_datetime(person["Start Time"]).dt.floor('min')
        end_times   = pd.to_datetime(person["End Time"])
        df = pd.DataFrame(columns=['shift', 'First Name', 'Last Name', 'date', 'Start Time', 'End Time', 'Schedule'])
        for shift, (firstName, lastName, start, end, schedule, regular) in enumerate(zip(person["First Name"], person["Last Name"], start_times, end_times, person["Schedule"], person["Regular"])):
            rng = pd.date_range(start, end, freq=freq, tz='America/Denver')  # [:-1]
            # regular = round(len(rng) / 60, 2)
            
            # minutes = rng.time
            # day = round((np.floor(((minutes   >= day_start) & (minutes   < day_end)).sum() * 100) / 100) / 60, 2)
            # night = regular - day

            # p_minutes = shift[shift["Schedule"] == "Paddington"]['date'].dt.time
            # p_day_minutes = ((p_minutes >= day_start) & (p_minutes < day_end)).sum()

            # row = pd.DataFrame({ 'shift': [shift] * len(rng), 'First Name': [firstName] * len(rng), 'Last Name': [lastName] * len(rng), 'date': rng, 'Schedule': [schedule] * len(rng), 'Regular': [regular] * len(rng), 'Sum Regular': [ sum_regular + regular] * len(rng), 'Day.': [day] * len(rng), 'Night.': [night] * len(rng) }, index=([shift] * len(rng)))
            row = pd.DataFrame([{ 'shift': shift, 'First Name': firstName, 'Last Name': lastName, 'date': date, 'Start Time': start, 'End Time': end, 'Schedule': schedule } for date in rng] , index=range(len(rng)))
            df = pd.concat([df, row])
            sum_regular += regular

        return df


    day_start, day_end = time(6,00), time(22,00)
    def by_shift(shift: pd.DataFrame, ceil=False):
        minutes = shift[shift["Schedule"] != "Paddington"]['date'].dt.time
        day_minutes   = ((minutes   >= day_start) & (minutes   < day_end)).sum()

        p_minutes = shift[shift["Schedule"] == "Paddington"]['date'].dt.time
        p_day_minutes = ((p_minutes >= day_start) & (p_minutes < day_end)).sum()

        print(f"pd.Series: {(day_minutes)} + {len(minutes) - day_minutes} = {len(minutes)}; {(p_day_minutes)} + {len(p_minutes) - p_day_minutes} = {len(p_minutes)} :: {len(shift)}")

        total  = len(shift) / toHours
        day    = day_minutes / toHours
        night  = (len(minutes) - day_minutes) / toHours
        pday   = p_day_minutes / toHours
        pnight = (len(p_minutes) - p_day_minutes) / toHours

        x = pd.Series({
            "__Total__": total,
            "Shift Day": day,
            "Shift Night": night,  
            "Shift P_Day": pday,  
            "Shift P_Night": pnight
        })
        
        # x = np.ceil(x  * 100) / 100 if ceil else x
        return x
    
    def calc_day_night_hours(rows: pd.DataFrame, ceil=False) -> typing.Tuple[int, int]:

            
        x = rows.groupby(["shift"], group_keys=True).apply(lambda shift: by_shift(shift, ceil))
        x["Sum"] = x[["Shift Day", "Shift Night", "Shift P_Day", "Shift P_Night"]].sum(axis=1)
        y = x[["Shift Day", "Shift Night", "Shift P_Day", "Shift P_Night"]].sum()
        print(rows["First Name"].iloc[0] + ' ' + rows["Last Name"].iloc[0])
        print(x)
        print("Totals")
        print(y)
        p(sum(y), prefix="Group Total: ", dont=True)
        return y



    def calcPerson(person):

        start_times = pd.to_datetime(person["Start Time"]).dt.floor('min')
        end_times   = pd.to_datetime(person["End Time"])
        # minutes = pd.DataFrame(columns=['shift', 'First Name', 'Last Name', 'date', 'Schedule'])
        # for shift, (firstName, lastName, start, end, schedule) in enumerate(zip(person["First Name"], person["Last Name"], start_times, end_times, person["Schedule"])):
        #     rng = pd.date_range(start, end, freq=freq, tz='America/Denver')[:-1]
        #     # regular = round(len(rng) / 60, 2)
            
        #     # minutes = rng.time
        #     # day = round((np.floor(((minutes   >= day_start) & (minutes   < day_end)).sum() * 100) / 100) / 60, 2)
        #     # night = regular - day

        #     # p_minutes = shift[shift["Schedule"] == "Paddington"]['date'].dt.time
        #     # p_day_minutes = ((p_minutes >= day_start) & (p_minutes < day_end)).sum()

        #     # row = pd.DataFrame({ 'shift': [shift] * len(rng), 'First Name': [firstName] * len(rng), 'Last Name': [lastName] * len(rng), 'date': rng, 'Schedule': [schedule] * len(rng), 'Regular': [regular] * len(rng), 'Sum Regular': [ sum_regular + regular] * len(rng), 'Day.': [day] * len(rng), 'Night.': [night] * len(rng) }, index=([shift] * len(rng)))
        #     row = pd.DataFrame([{ 'shift': shift, 'First Name': firstName, 'Last Name': lastName, 'date': date, 'Schedule': schedule } for date in rng] , index=range(len(rng)))
        #     minutes = pd.concat([minutes, row])

            
        def rowFunc(row):
            shift, (firstName, lastName, start, end, schedule) = row
            rng = pd.date_range(start, end, freq=freq, tz='America/Denver')[:-1]
            size = len(rng)
            return pd.DataFrame({ 'shift': [shift]*size, 'First Name': [firstName]*size, 'Last Name': [lastName]*size, 'date': rng, 'Schedule': [schedule]*size }, index=range(size))

        minutes = pd.concat([rowFunc(row) for row in enumerate(zip(person["First Name"], person["Last Name"], start_times, end_times, person["Schedule"]))])
        print(minutes)

        # print(minutes)

        def calcShift(shift_minutes: pd.DataFrame):
            lastItem = shift_minutes.iloc[-1]

            lastItem['minutes'] = len(shift_minutes)
            lastItem['regular'] = round(len(shift_minutes) / 60, 2)
            # lastItem['regular'] = np.ceil((len(shift_minutes) / 60) * 100) / 100


            minutes = shift_minutes['date'].dt.time
            # day = round((np.floor(((minutes >= day_start) & (minutes < day_end)).sum() * 100) / 100) / 60, 2)
            _hours = math.ceil((len(minutes)/60)*100)/100
            _day_minutes = ((minutes >= day_start) & (minutes < day_end)).sum()
            _day_hours = round(_day_minutes/60, 2)
            _night_hours = _hours - _day_hours

            day = _day_hours
            # night = _night_hours

            night = lastItem['regular'] - day

            hours = (day, night, 0, 0) if lastItem['Schedule'] != 'Paddington' else (0, 0, day, night)
            lastItem['day'], lastItem['night'], lastItem['pday'], lastItem['pnight'] = hours


            # minutes = shift_minutes['date'].dt.time
            # night1 = round((np.floor(((minutes < day_start)).sum() * 100) / 100) / 60, 2) 
            # day = round((np.floor(((minutes >= day_start) & (minutes < day_end)).sum() * 100) / 100) / 60, 2)
            # night2 = lastItem['regular'] - (night1 + day)

            # hours = (day, night1, night2, 0, 0, 0) if lastItem['Schedule'] != 'Paddington' else (0, 0, 0, day, night1, night2)
            # lastItem['day'], lastItem['night1'], lastItem['night2'], lastItem['pday'], lastItem['pnight1'], lastItem['pnight2'] = hours

            return lastItem

        def calcWeek(week: pd.DataFrame):
            
            # print(f"+++++  Week  {week['Week'].iloc[0].item()}  +++++")

            hasOverTime = len(week['date']) > forty
            if hasOverTime:

                isOT = week['date'] >= week['date'].iloc[forty]
                print("=====  40 Hours  =====")
                week_group = week[~isOT]
                shifts =  week_group.groupby('shift').apply(calcShift)[["day", "night", "pday", "pnight"]].sum().round(2)
                # shifts['CumSum regular'] = shifts['regular'].cumsum()
                # print(shifts)
                day, night, pday, pnight = shifts["day"], shifts["night"], shifts["pday"], shifts["pnight"]
                # assert day + night + pday + pnight == 40, f"Sum of Day and Night are not 40: {day + night + pday + pnight}"

                print("=====  OT Hours  =====")
                # isOT = week['date'] >= week['date'].iloc[forty - 1]
                week_group_ot = week[ isOT]
                shifts_ot =  week_group_ot.groupby('shift').apply(calcShift)[["day", "night", "pday", "pnight"]].sum().round(2)
                # shifts_ot['CumSum regular'] = shifts_ot['regular'].cumsum()
                # print(shifts_ot)
                dayot, nightot, pdayot, pnightot = shifts_ot["day"], shifts_ot["night"], shifts_ot["pday"], shifts_ot["pnight"]

                # return pd.concat([shifts, shifts_ot]).apply(calcOT, axis=1)
                
            else:

                print("===== < 40 Hours =====")
                week_group = week
                shifts =  week_group.groupby('shift').apply(calcShift)[["day", "night", "pday", "pnight"]].sum().round(2)
                # shifts['CumSum regular'] = shifts['regular'].cumsum()
                # print(shifts)
                day, night, pday, pnight = shifts["day"], shifts["night"], shifts["pday"], shifts["pnight"]
                dayot, nightot, pdayot, pnightot = (0, 0, 0, 0)

                # return shifts.apply(calcOT, axis=1)

            assert round(day + night + pday + pnight, 1) <= 40, "Sum of Day and Night are not less than 40: "+str(day + night + pday + pnight) 

            x = pd.Series({ "Day": day, "Night": night, "Day_OT": dayot, "Night_OT": nightot, "Paddington Day": pday, "Paddington Night": pnight, "Paddington Day_OT": pdayot, "Paddington Night_OT": pnightot })
            print(x)
            return x


        minutes['Week'] = minutes['date'].dt.strftime("%U").astype(int)
        return minutes.groupby('Week').apply(calcWeek)

    freq, toHours, forty = "min", (60), (40 * 60)

    st = datetime.now()
    print("Start Time: ", st)
    # calculated = sheet.groupby(["Last Name", "First Name"]).filter(lambda x: x["First Name"].iloc[0] in ["CORRINA", "JANELL", "EDITH", "RYLEE", "SUMMER", "FANNY"]).groupby(["Last Name", "First Name"]).apply(calcPerson)
    # calculated = sheet.groupby(["Last Name", "First Name"]).filter(lambda x: x["First Name"].iloc[0] in ["CORRINA", "JANELL"]).groupby(["Last Name", "First Name"]).apply(calcPerson)
    calculated = sheet.groupby(["Last Name", "First Name"], group_keys=True).apply(calcPerson)
    print("Duration: ", datetime.now() - st)


    # ========================================================================
    # =================         Day And Night OT         =====================
    # ========================================================================
    eight_columns = ["Day", "Night", "Day_OT", "Night_OT", "Paddington Day", "Paddington Night", "Paddington Day_OT", "Paddington Night_OT"]


    g = calculated.groupby(["Last Name", "First Name", "Week"]).sum()

    non_ot = g[["Day", "Paddington Day", "Night", "Paddington Night"]].sum(axis=1, numeric_only=True)
    weeks = list(set(non_ot.index.get_level_values('Week')))
    weeks.sort()
    # week1_non_ot = list(non_ot[non_ot.index.get_level_values('Week') == weeks[0]].values.copy())
    # week2_non_ot = list(non_ot[non_ot.index.get_level_values('Week') == weeks[1]].values.copy())
    # print({"non_ot": non_ot, "week1_non_ot": week1_non_ot, "week2_non_ot": week2_non_ot})

    g["Total OT"] = g["Day_OT"] + g["Night_OT"] + g["Paddington Day_OT"] + g["Paddington Night_OT"]
    g["Total Hours"] = g[eight_columns].sum(axis=1)

    # Weighted Overtime
    g[["Day Rate", "Night Rate"]] = pay_rates.groupby(["LAST", "FIRST"]).max()[["Day Rate", "Night Rate"]]

    g["Day Pay"]      =  g["Day Rate"]   *        g["Day"]
    g["Day_OT Pay"]   = (g["Day Rate"]   * 1.5) * g["Day_OT"]
    g["Night Pay"]    =  g["Night Rate"] *        g["Night"]
    g["Night_OT Pay"] = (g["Night Rate"] * 1.5) * g["Night_OT"]
    g["Paddington Day Pay"]      =  (g["Day Rate"]   + 2) *        g["Paddington Day"]
    g["Paddington Day_OT Pay"]   = ((g["Day Rate"]   + 2) * 1.5) * g["Paddington Day_OT"]
    g["Paddington Night Pay"]    =  (g["Night Rate"] + 2) *        g["Paddington Night"]
    g["Paddington Night_OT Pay"] = ((g["Night Rate"] + 2) * 1.5) * g["Paddington Night_OT"]

    g["Pay"]    = g["Day Pay"]    + g["Night Pay"]    + g["Paddington Day Pay"]    + g["Paddington Night Pay"]
    g["Pay_OT"] = g["Day_OT Pay"] + g["Night_OT Pay"] + g["Paddington Day_OT Pay"] + g["Paddington Night_OT Pay"]


    """ OUTPUT: Total Day, Total Night, Total Weighted OT, Paddington Bonus, TOTAL PAY (PAY1+PAY2+WOT1+WOT2+P1+P2) """
    d = g.groupby(["Last Name", "First Name"]).sum()
    d["Total Pay"] = d[["Pay", "Pay_OT"]].sum(axis=1)
   

    pay_output = d[["Day Pay", "Paddington Day Pay", "Day_OT Pay", "Paddington Day_OT Pay", "Night Pay", "Paddington Night Pay", "Night_OT Pay", "Paddington Night_OT Pay", "Pay", "Pay_OT", "Total Pay"]]
    hours_output = d[["Day", "Paddington Day", "Day_OT", "Paddington Day_OT", "Night", "Paddington Night", "Night_OT", "Paddington Night_OT", "Total OT", "Total Hours"]]
    if args.verify_output:
        print(pay_output.to_string(index=True))
        print(hours_output.to_string(index=True))
        print()


    # Calc Diff
    sheet_hours = sheet.groupby(["Last Name", "First Name"], group_keys=True)[["Regular", "OT"]].sum(numeric_only=True)
    sheet_hours["Total"] = sheet_hours.sum(axis=1, numeric_only=True)
    d["Total Regular"] = d[["Day", "Paddington Day", "Night", "Paddington Night"]].sum(axis=1, numeric_only=True)

    hours_output["Diff Regular"] = (d["Total Regular"] - sheet_hours["Regular"]).round(2)
    hours_output["Diff OT"]      = (d["Total OT"]      - sheet_hours["OT"]).round(2)
    hours_output["Diff Total"]   = (d["Total Hours"]   - sheet_hours["Total"]).round(2)

    print("\n\n=====  Diff  =====")
    print(hours_output["Diff Regular"])
    print(hours_output["Diff OT"]     )
    print(hours_output["Diff Total"]  )

    # hours_output["Sheet Regular"] = sheet_hours["Regular"]
    # hours_output["Sheet OT"]      = sheet_hours["OT"]
    # hours_output["Sheet Total"]   = sheet_hours["Total"]

    gg = g.groupby(["Last Name", "First Name", "Week"])

    # print(hours_output["1 Diff Regular"].shape, week1_non_ot.shape)
    # hours_output["1 Diff Regular"] = week1_non_ot
    # hours_output["1 Diff OT"]      = (gg["Total OT"]      - sheet_hours["OT"]).round(2)
    # hours_output["1 Diff Total"]   = (gg["Total Hours"]   - sheet_hours["Total"]).round(2)
    
    # hours_output["2 Diff Regular"] = week2_non_ot
    # hours_output["2 Diff OT"]      = (gg["Total OT"]      - sheet_hours["OT"]).round(2)
    # hours_output["2 Diff Total"]   = (gg["Total Hours"]   - sheet_hours["Total"]).round(2)

    
    # Reorder the Columns to the Output Kelly McMullin desires
    pay_output = pay_output[["Day Pay", "Night Pay", "Paddington Night Pay", "Night_OT Pay", "Paddington Night_OT Pay", "Day_OT Pay", "Paddington Day_OT Pay", "Paddington Day Pay", "Pay", "Pay_OT", "Total Pay"]]
    hours_output = hours_output[["Day", "Night", "Paddington Night", "Night_OT", "Paddington Night_OT", "Day_OT", "Paddington Day_OT", "Paddington Day", "Total OT", "Total Hours", "Diff Regular", "Diff OT", "Diff Total"]]


    def toSheet(writer: pd.ExcelWriter, data: pd.DataFrame, sheet_name: str):

        workbook = writer.book

        index_format = workbook.add_format({'right': 1, 'right_color': '#4F81BD', 'left': 1, 'left_color': '#4F81BD', 'bottom': 1, 'bottom_color': '#4F81BD'})
        column_format = workbook.add_format({})
        green_format = workbook.add_format({'bg_color': '#C6EFCE'})
        red_format = workbook.add_format({'bg_color': '#FFC7CE'})

        data = data.reset_index()

        data.to_excel(writer, sheet_name=sheet_name, na_rep='NaN', startrow=1, header=False, index=False)
        
        # Set Column Width
        for col_idx in range(len(data.columns)):
            column_width = max(data[data.columns[col_idx]].astype(str).map(len).max(), len(data.columns[col_idx]))  # finds largest cell width in column
            writer.sheets[sheet_name].set_column(col_idx, col_idx, column_width + 2, column_format)

        # Set Index Border
        for row_idx, row in data.iterrows():
            writer.sheets[sheet_name].write(row_idx + 1, 0, row[0], index_format)
            writer.sheets[sheet_name].write(row_idx + 1, 1, row[1], index_format)

        # Set Diff Cell Red/Green
        for row_idx, row in data.iterrows():
            for col_idx, col in enumerate(row):
                # print({'row_idx': row_idx, 'col_idx': col_idx, 'col': col, 'column_name': data.columns[col_idx]})
                
                if not isinstance(col, (int, float)):
                    continue

                column_name = data.columns[col_idx]
                if "Diff" not in column_name:
                    continue

                _format = green_format if col > 0 else red_format if col < 0 else None
                writer.sheets[sheet_name].write(row_idx + 1, col_idx, col, _format)

        # Get the dimensions of the dataframe.
        (max_row, max_col) = data.shape

        # Create a list of column headers, to use in add_table().
        column_settings = [{'header': column} for column in data.columns]

        # Add the Excel table structure. Pandas will add the data.
        writer.sheets[sheet_name].add_table(0, 0, max_row, max_col - 1, {'columns': column_settings, 'autofilter': False, 'banded_columns': False, 'style': 'Table Style Medium 9'})

        return workbook, writer.sheets[sheet_name]


    # Save File
    output_filename = args.timesheet.replace(".xlsx", f"{args.output_tag}.xlsx")
    writer = pd.ExcelWriter(cd / output_filename)
    
    # Hours Output
    toSheet(writer=writer, data=hours_output, sheet_name=args.output_sheet_name + ' - Hours')

    # Pay Output
    toSheet(writer=writer, data=pay_output, sheet_name=args.output_sheet_name + ' - Pay')

    writer.close()


def main():
    try:
        args = parse_args()

        if args.timesheet is None:

            for i, f in enumerate(excel_files):
                print(f"{i}: {f}")

            print()

            args.timesheet = excel_files[int(input(f"Select a file (0-{len(excel_files)-1}) >>> "))]

        print()

        _main(args)

        print()

    except Exception as e:
        print("ERROR : " + str(e))
        print()
        raise ValueError(str(e))

    finally:
        input("Press Enter to exit ...")


if __name__ == "__main__":
    main()