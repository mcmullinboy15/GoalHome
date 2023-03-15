import os
import pytz
import typing
import pathlib
import argparse
import pandas as pd
from datetime import datetime, timedelta, date, time


cd = pathlib.Path(os.path.dirname(os.path.realpath(__file__)))
files = os.listdir(cd)
excel_files = list(filter(lambda x: not x.startswith("~") and x.endswith(".xlsx"), files))


def parse_args():
    parser = argparse.ArgumentParser()


    parser.add_argument("--timesheet", type=str, choices=excel_files)
    parser.add_argument("--timesheet-sheet-name", type=str, default="Entries")

    parser.add_argument("--output-tag", type=str, default=" - Payroll")
    parser.add_argument("--output-sheet-name", type=str, default="Payroll")

    parser.add_argument("--pay-rate-file", type=str, default="Pay Rate.xlsx")
    parser.add_argument("--pay-rate-sheet-name", type=str, default="Pay Rate")

    parser.add_argument("--verify-pay-rates",  action="store_true")
    parser.add_argument("--verify-day-night",  action="store_true")
    parser.add_argument("--verify-weighted",   action="store_true")
    parser.add_argument("--verify-paddington", action="store_true")

    parser.add_argument("-v", "--verbose", action="store_true")
    return parser.parse_args()


def main(args):

    if args.verbose:
        print(args)


    sheet = pd.read_excel(cd / args.timesheet, sheet_name=args.timesheet_sheet_name, parse_dates=["Date", "Start Time", "End Time"])
    pay_rates = pd.read_excel(cd / args.pay_rate_file, sheet_name=args.pay_rate_sheet_name)
    if args.verify_pay_rates:
        print(pay_rates.to_string())
        return


    # Uppercase ["Last Name", "First Name"]
    sheet["Last Name"] = sheet["Last Name"].str.upper()
    sheet["First Name"] = sheet["First Name"].str.upper()

    # Rename column "Regular" to "Total"
    sheet["Total"] = sheet["Regular"]


    # Sort Sheet by Date
    sheet.sort_values(by=["Date"], inplace=True)
    

    # Find Nights: Count the number of minutes that are between 10PM - 6AM and divide by 60
    def countNightHours(x):
        r = pd.date_range(x["Start Time"], x["End Time"], freq="min")
        night_minutes = r[(time(22,00) <= r.time) | (r.time < time(6,00))]
        return len(night_minutes) / 60

    sheet["Night"] = sheet.apply(countNightHours, axis=1)
    

    # Subract Nights from Total and put in "Day"
    sheet["Day"] = sheet["Total"] - sheet["Night"]


    # "Week" = {first week: 1, second week: 2} (7 days)
    sheet["Week"] = sheet["Start Time"].dt.strftime("%U").astype(int)
    sheet["Week"] = sheet["Week"] - min(sheet["Week"]) + 1


    # Print Day and Night Infromation
    if args.verify_day_night:
        print(sheet[["Date", "Last Name", "First Name", "Day", "Night", "Total"]].to_string())                             # All info
        print()
        print(sheet.groupby(["Last Name", "First Name", "Week"])[["Day", "Night", "Total"]].sum().to_string())     # Grouped by person and week
        print()
        print(sheet.groupby(["Last Name", "First Name"])[["Day", "Night", "Total"]].sum().to_string())             # Grouped by only person
        return
    

    # Get their(a person's) Day hours, and night Hours, GroupedBy week (sum of those hours)
    g = sheet.groupby(["Last Name", "First Name", "Week"])[["Total", "Day", "Night"]].sum()


    # Weighted Overtime
    g[["Day Rate", "Night Rate"]] = pay_rates.groupby(["LAST", "FIRST"]).max()[["Day Rate", "Night Rate"]]

    g["Pay"] = (g["Day Rate"] * g["Day"]) + (g["Night Rate"] * g["Night"])

    g["OT Hours"] = (g["Total"] - 40).clip(lower=0)
    g["Weighted Rate"] = g["Pay"] / g["Total"]
    g["Weighted OT"] = g["OT Hours"] * (g["Weighted Rate"] * 0.5)

    if args.verify_weighted:
        print(g[["Day Rate", "Day", "Night Rate", "Night", "Pay", "OT Hours", "Weighted Rate", "Weighted OT"]].to_string())
        return


    # Number of hours worked per schedule from "Total" (times 2, paddington only)
    g[["Paddington Bonus"]] = sheet[sheet["Schedule"] == "Paddington"].groupby(["Last Name", "First Name", "Week"])[["Total"]].sum() * 2
    if args.verify_paddington:
        print(g[["Paddington Bonus"]].to_string())
        return


    """ OUTPUT: Total Day, Total Night, Total Weighted OT, Paddington Bonus, TOTAL PAY (PAY1+PAY2+WOT1+WOT2+P1+P2) """
    d = g.groupby(["Last Name", "First Name"]).sum().round(3)
    d["Total Pay"] = d[["Pay", "Weighted OT", "Paddington Bonus"]].sum(axis=1)


    output = d[["Day", "Night", "Weighted OT", "Paddington Bonus", "Total Pay"]]
    print(output.to_string())
    print()

    # Save File
    output_filename = args.timesheet.replace(".xlsx", f"{args.output_tag}.xlsx")
    writer = pd.ExcelWriter(cd / output_filename)
    output.to_excel(writer, sheet_name=args.output_sheet_name, na_rep='NaN')
    
    # Set Column width
    for col_idx in range(len(output.index.names) + len(output.columns)):
        writer.sheets[args.output_sheet_name].set_column(col_idx, col_idx, 20)

    writer.close()


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
        print("ERROR : "+str(e))
        print()

    finally:
        input("Press Enter to exit ...")