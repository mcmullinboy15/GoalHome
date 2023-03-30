import os
import pytz
import typing
import pathlib
import argparse
import pandas as pd
pd.set_option('display.max_columns', None)
pd.set_option('display.max_rows', None)
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
    parser.add_argument("--verify-weighted",   action="store_true")
    parser.add_argument("--verify-paddington", action="store_true")

    parser.add_argument("-v", "--verbose", action="store_true")
    return parser.parse_args()

def p(x, prefix="", func=lambda x: x):
    print(prefix)
    print(func(x))
    input("...")
    return x

def main(args):

    if args.verbose:
        print(args)


    sheet: pd.DataFrame = pd.read_excel(cd / args.timesheet, sheet_name=args.timesheet_sheet_name, parse_dates=["Date", "Start Time", "End Time"], usecols=["First Name", "Last Name", "Date", "Start Time", "End Time", "Regular", "Schedule"])
    pay_rates = pd.read_excel(cd / args.pay_rate_file, sheet_name=args.pay_rate_sheet_name)
    if args.verify_pay_rates:
        print(pay_rates.to_string())
        return


    # Uppercase ["Last Name", "First Name"]
    sheet["Last Name"] = sheet["Last Name"].str.upper()
    sheet["First Name"] = sheet["First Name"].str.upper()


    # Sort Sheet by Date
    sheet.sort_values(by=["Date"], inplace=True)


    def person_to_minutes(person):
        start_times = pd.to_datetime(person["Start Time"]).dt.floor('min')
        end_times = pd.to_datetime(person["End Time"])

        def func(start, end, schedule):
            rng = (pd.date_range(start, end, freq=freq)[:-1])
            p((len(rng), round(len(rng) / toHours, 2)), prefix="Punsh In:")
            return pd.DataFrame({'date': rng, 'Schedule': [schedule] * len(rng)}).round(2)
        
        return pd.concat([func(start, end, schedule) for start, end, schedule in zip(start_times, end_times, person["Schedule"])]) # .reset_index(drop=True)

    day_start, day_end = time(6,00), time(22,00)
    def minutes_to_daynight_hours(minutes) -> typing.Tuple[int, int]:
        # p(pd.concat([minutes, (minutes > day_start), (minutes < day_end), (minutes > day_start) & (minutes < day_end)], axis=1), prefix="MINUTES: ")
        # p((len(minutes), (minutes > day_start).sum(), (minutes < day_end).sum(), ((minutes > day_start) & (minutes < day_end)).sum()), prefix="MINUTES: ")
        day_minutes = ((minutes >= day_start) & (minutes < day_end)).sum()
        # p((len(minutes), len(minutes) / 60), prefix="minutes: ")
        # p((len(minutes[(minutes > day_start)]), len(minutes[(minutes > day_start)]) / 60), prefix="day_minutes - (minutes > day_start): ")
        # p((len(minutes[(minutes < day_end)]), len(minutes[(minutes < day_end)]) / 60), prefix="day_minutes - (minutes < day_end): ")
        # p((day_minutes, day_minutes / 60), prefix="day_minutes: ")
        # p((day_minutes / toHours, (len(minutes) - day_minutes), (len(minutes) - day_minutes) / toHours ), prefix="day_minutes: ")
        return day_minutes / toHours, (len(minutes) - day_minutes) / toHours    


    def calcPerson(person):
        p(person[["Last Name", "First Name"]], prefix="Person:")
        minutes = person_to_minutes(person)
        # p(round(len(minutes) / toHours, 2), prefix="Hours:")

        minutes['Week'] = minutes['date'].dt.strftime("%U").astype(int)

        def calcWeek(week):

            paddington_hours = len(week[week["Schedule"] == "Paddington"])
            # p((paddington_hours, paddington_hours / 60), prefix="Paddington: ")

            # p((len(week['date']) > forty, str(len(week['date'])) + ' > ' + str(forty)), prefix="isOverTime: ")
            isOverTime = len(week['date']) > forty
            if not isOverTime:
                (day, night) = minutes_to_daynight_hours(week['date'].dt.time)
                return pd.Series({"Day": day, "Night": night, "Day_OT": 0, "Night_OT": 0, "Paddington Hours": paddington_hours / toHours}).round(2)

            isOT = week['date'] >= week['date'].iloc[forty]
            # p((len(week[~isOT]), len(week[~isOT]) / 60), prefix="isNotOT: ")
            # p((len(week[isOT]), len(week[isOT]) / 60), prefix="isOT: ")
            (day, night)       = minutes_to_daynight_hours(week[~isOT]['date'].dt.time)
            (day_ot, night_ot) = minutes_to_daynight_hours(week[isOT]['date'].dt.time)
            # p((day_ot, night_ot), prefix="OT: ")
            return pd.Series({"Day": day, "Night": night, "Day_OT": day_ot, "Night_OT": night_ot, "Paddington Hours": paddington_hours / toHours}).round(2)
            
        return minutes.groupby(['Week'], group_keys=True).apply(calcWeek)


    # freq, toHours, forty = "S", (60 * 60), (40 * 60 * 60)

    # st = datetime.now()
    # print("Start Time: ", st)
    # g1 = sheet.groupby(["Last Name", "First Name"]).apply(calcPerson)
    # print("Duration: ", datetime.now() - st)


    freq, toHours, forty = "min", (60), (40 * 60)

    st = datetime.now()
    print("Start Time: ", st)
    # g2 = sheet.groupby(["Last Name", "First Name"]).filter(lambda x: x["First Name"].iloc[0] == "FANNY").groupby(["Last Name", "First Name"]).apply(calcPerson)
    g2 = sheet.groupby(["Last Name", "First Name"]).apply(calcPerson)
    print("Duration: ", datetime.now() - st)

    # print(g1)
    print(g2)
    # print("Day: \t", round((g1["Day"] - g2["Day"]).sum(skipna=True), 2), "\t$"+str(round((g1["Day"] - g2["Day"]).sum(skipna=True) * 25, 2)))
    # print("Night: \t", round((g1["Night"] - g2["Night"]).sum(skipna=True), 2), "\t$"+str(round((g1["Night"] - g2["Night"]).sum(skipna=True) * 25, 2)))
    # print("Day_OT: \t", round((g1["Day_OT"] - g2["Day_OT"]).sum(skipna=True), 2), "\t$"+str(round((g1["Day_OT"] - g2["Day_OT"]).sum(skipna=True) * 25, 2)))
    # print("Night_OT: \t", round((g1["Night_OT"] - g2["Night_OT"]).sum(skipna=True), 2), "\t$"+str(round((g1["Night_OT"] - g2["Night_OT"]).sum(skipna=True) * 25, 2)))


    # ========================================================================
    
    # Get their(a person's) Day hours, and night Hours, GroupedBy week (sum of those hours)
    g3 = g2.copy(deep=True)
    g3["Day"] = g3["Day"] + g3["Day_OT"]
    g3["Night"] = g3["Night"] + g3["Night_OT"]
    g3["Total"] = g3["Day"] + g3["Night"]
    print("g2: ", g3)
    g = g3.groupby(["Last Name", "First Name", "Week"])#[["Total", "Day", "Night", "Paddington Hours"]]# .sum().round(2)
    g = g3.groupby(["Last Name", "First Name", "Week"])[["Total", "Day", "Night", "Paddington Hours"]].max()# .sum().round(2)
    print("g: ", g)


    # Weighted Overtime
    g[["DayRate", "NightRate"]] = pay_rates.groupby(["LAST", "FIRST"]).max()[["Day Rate", "Night Rate"]]

    # p((g[["DayRate"]], g[["NightRate"]]), prefix="PAY1: ")
    # p((g[["Day", "Night"]]), prefix="PAY2: ")
    # p((g["DayRate"] * g["Day"]), prefix="PAY3: ")
    # p((g["NightRate"] * g["Night"]), prefix="PAY4: ")
    g["Pay"] = (g["DayRate"] * g["Day"]) + (g["NightRate"] * g["Night"])

    g["OT Hours"] = (g["Total"] - 40).clip(lower=0)
    g["Weighted Rate"] = g["Pay"] / g["Total"]
    g["Weighted OT"] = g["OT Hours"] * (g["Weighted Rate"] * 0.5)

    if args.verify_weighted:
        print(g[["Day Rate", "Day", "Night Rate", "Night", "Pay", "OT Hours", "Weighted Rate", "Weighted OT"]].to_string())
        return


    # Number of hours worked per schedule from "Total" (times 2, paddington only)
    g["Paddington Bonus"] = g["Paddington Hours"] * 2
    print("g.paddington: ", g)

    if args.verify_paddington:
        print(g[["Paddington Bonus"]].to_string())
        return
    

    """ OUTPUT: Total Day, Total Night, Total Weighted OT, Paddington Bonus, TOTAL PAY (PAY1+PAY2+WOT1+WOT2+P1+P2) """
    d1 = g.groupby(["Last Name", "First Name"]).sum().round(3)
    d1["Total Pay"] = d1[["Pay", "Weighted OT", "Paddington Bonus"]].sum(axis=1)


    output1 = d1[["Day", "Night", "Weighted OT", "Paddington Bonus", "Total Pay"]]
    print(output1.to_string())
    print()
    
    # Save File
    output_filename = args.timesheet.replace(".xlsx", f"{args.output_tag}.WeightedOT.xlsx")
    writer = pd.ExcelWriter(cd / output_filename)
    output1.to_excel(writer, sheet_name=args.output_sheet_name, na_rep='NaN', startrow=1, header=False, index=False)
    
    # Set Column width
    for col_idx in range(len(output1.index.names) + len(output1.columns)):
        column_name = output1.columns[col_idx - len(output1.index.names)]
        column_width = max(output1[column_name].astype(str).map(len).max(), len(column_name))
        writer.sheets[args.output_sheet_name].set_column(col_idx, col_idx, column_width+4)


    workbook = writer.book
    worksheet = writer.sheets[args.output_sheet_name]



    # Get the dimensions of the dataframe.
    (max_row, max_col) = output1.shape

    # Create a list of column headers, to use in add_table().
    column_settings = [{'header': column} for column in output1.columns]

    # Add the Excel table structure. Pandas will add the data. (+2 for my index)
    worksheet.add_table(0, 0, max_row, (max_col - 1), {'columns': column_settings, 'autofilter': False, 'banded_columns': False, 'style': 'Table Style Medium 9'})

    writer.close()


    # ========================================================================


    # gp = g1
    g = g2.groupby(["Last Name", "First Name", "Week"]).sum()

    # g["Hours"] = g["Day"] + g["Night"]
    # g["Hours_OT"] = g["Day_OT"] + g["Night_OT"]
    g["Total Hours"] = g["Day"] + g["Day_OT"] + g["Night"] + g["Night_OT"]

    # Weighted Overtime
    g[["Day Rate", "Night Rate"]] = pay_rates.groupby(["LAST", "FIRST"]).max()[["Day Rate", "Night Rate"]]

    g["Day Pay"]      = g["Day Rate"]  * g["Day"]
    g["Day_OT Pay"]   = (g["Day Rate"] * 1.5) * g["Day_OT"]
    g["Night Pay"]    = g["Night Rate"] * g["Night"]
    g["Night_OT Pay"] = (g["Night Rate"] * 1.5) * g["Night_OT"]
    # p((g[["Day Rate", "Night Rate"]], g["Night_OT"]), prefix="Rates: ")
    # input("...")
    g["Pay"] = g["Day Pay"] + g["Night Pay"]
    g["Pay_OT"] = g["Day_OT Pay"] + g["Night_OT Pay"]

    if args.verify_weighted:
        print(g[["Day Pay", "Day_OT Pay", "Night Pay", "Night_OT Pay", "Pay", "Pay_OT", "Total Hours"]].to_string())
        return

    # Number of hours worked per schedule from "Total Hours" (times 2, paddington only)
    g[["Paddington Bonus"]] = g[["Paddington Hours"]] * 2
    if args.verify_paddington:
        print(g[["Paddington Bonus"]].to_string())
        return


    """ OUTPUT: Total Day, Total Night, Total Weighted OT, Paddington Bonus, TOTAL PAY (PAY1+PAY2+WOT1+WOT2+P1+P2) """
    d = g.groupby(["Last Name", "First Name"]).sum().round(3)
    d["Total Pay"] = d[["Pay", "Pay_OT", "Paddington Bonus"]].sum(axis=1)


    # output = d[["Day Pay", "Day_OT Pay", "Night Pay", "Night_OT Pay", "Pay", "Pay_OT", "Day", "Day_OT", "Night", "Night_OT", "Paddington Bonus", "Total Hours", "Total Pay"]].reset_index()
    # print(output.to_string())
    # print()
    
    output = d[["Day", "Night", "Day_OT", "Night_OT", "Paddington Bonus", "Total Pay"]]
    print(output.to_string())
    print()


    # Save File
    output_filename = args.timesheet.replace(".xlsx", f"{args.output_tag}.DayAndNightOT.xlsx")
    writer = pd.ExcelWriter(cd / output_filename)
    output.to_excel(writer, sheet_name=args.output_sheet_name, na_rep='NaN', startrow=1, header=False, index=False)
    
    # Set Column width
    for col_idx in range(len(output.index.names) + len(output.columns)):
        column_name = output.columns[col_idx - len(output.index.names)]
        column_width = max(output[column_name].astype(str).map(len).max(), len(column_name))
        writer.sheets[args.output_sheet_name].set_column(col_idx, col_idx, column_width+4)


    workbook = writer.book
    worksheet = writer.sheets[args.output_sheet_name]



    # Get the dimensions of the dataframe.
    (max_row, max_col) = output.shape

    # Create a list of column headers, to use in add_table().
    column_settings = [{'header': column} for column in output.columns]

    # Add the Excel table structure. Pandas will add the data. (+2 for my index)
    worksheet.add_table(0, 0, max_row, (max_col - 1), {'columns': column_settings, 'autofilter': False, 'banded_columns': False, 'style': 'Table Style Medium 9'})


    #  Output1

    
    # Save File
    # output_filename = args.timesheet.replace(".xlsx", f"{args.output_tag}.DayAndNightOT.xlsx")
    # writer = pd.ExcelWriter(cd / output_filename)
    output1.to_excel(writer, sheet_name=args.output_sheet_name+'Weighted', na_rep='NaN', startrow=1, header=False, index=False)
    
    # Set Column width
    for col_idx in range(len(output1.index.names) + len(output1.columns)):
        column_name = output1.columns[col_idx - len(output1.index.names)]
        column_width = max(output1[column_name].astype(str).map(len).max(), len(column_name))
        writer.sheets[args.output_sheet_name+'Weighted'].set_column(col_idx, col_idx, column_width+4)


    workbook = writer.book
    worksheet = writer.sheets[args.output_sheet_name+'Weighted']



    # Get the dimensions of the dataframe.
    (max_row, max_col) = output1.shape

    # Create a list of column headers, to use in add_table().
    column_settings = [{'header': column} for column in output1.columns]

    # Add the Excel table structure. Pandas will add the data. (+2 for my index)
    worksheet.add_table(0, 0, max_row, (max_col - 1), {'columns': column_settings, 'autofilter': False, 'banded_columns': False, 'style': 'Table Style Medium 9'})


    writer.close()

    print(d)
    print("DayAndNightOT: ", d[["Total Pay"]].sum().round(2).item())
    print("   WeightedOT: ", d1[["Total Pay"]].sum().round(2).item())
    print("New Costs You: ", (d[["Total Pay"]].sum() - d1[["Total Pay"]].sum()).round(2).item())


if __name__ == "__main__":

    try:
        args = parse_args()

        if args.timesheet is None:

            for i, f in enumerate(excel_files):
                print(f"{i}: {f}")

            print()

            args.timesheet = excel_files[int(input(f"Select a file (0-{len(excel_files)-1}) >>> "))]

        print()

        main(args)

        print()

    except Exception as e:
        print("ERROR : " + str(e))
        print()
        raise ValueError(str(e))

    finally:
        input("Press Enter to exit ...")