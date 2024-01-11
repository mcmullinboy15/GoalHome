import math
from pprint import pprint
import pandas as pd
from datetime import datetime, timedelta, date, time


def run(start, end, row={"Regular": "NA", "OT": "NA"}):

    # date_format = "%m/%d/%Y %I:%M:%S %p"
    # start_dt = datetime.strptime(start, date_format)
    # end_dt = datetime.strptime(end, date_format)

    day_start, day_end = time(6,00), time(22,00)

    minutes_range = pd.date_range(start, end, freq="min", tz="America/Denver")[:-1].time
    day_minutes = ((minutes_range >= day_start) & (minutes_range < day_end)).sum()
    
    minutes,       hours       = (len(minutes_range), math.ceil((len(minutes_range)/60)*100)/100)
    # day_minutes,   day_hours   = (day_minutes, math.ceil((day_minutes/60)*100)/100)
    day_minutes,   day_hours   = (day_minutes, round(day_minutes/60, 2))
    # night_minutes, night_hours = (minutes - day_minutes, math.ceil(((minutes - day_minutes)/60)*100)/100)
    night_minutes, night_hours = (minutes - day_minutes, hours - day_hours)

    print("="*20, "="*20)
    print(start, end)
    # print(minutes, hours, len(minutes_range)/60)
    # print(day_minutes, day_hours, day_minutes/60)
    # print(night_minutes, night_hours, (minutes - day_minutes)/60)

    assert hours == round(night_hours + day_hours, 2), f"rounding didn't equal: {hours} != {round(night_hours + day_hours, 2)}"

    print(len(minutes_range)/60, day_minutes/60, (minutes - day_minutes)/60, row["Regular"], row["OT"])
    print(round(len(minutes_range)/60, 2), round(day_minutes/60, 2), round((minutes - day_minutes)/60, 2), row["Regular"], row["OT"])

    # return minutes, hours, len(minutes_range)/60, day_minutes, day_hours, day_minutes/60, night_minutes, night_hours, (minutes - day_minutes)/60
    return len(minutes_range)/60, day_minutes/60, (minutes - day_minutes)/60, row["Regular"], row["OT"]


start = "4/4/2023 11:52:00 AM"
end = "4/4/2023 5:12:00 PM"
run(start, end)

start = "4/6/2023 10:03:00 PM"
end = "4/7/2023 3:31:00 AM"
run(start, end)

start = "4/5/2023 9:35:00 PM"
end = "4/6/2023 10:03:00 AM"
run(start, end)

start = "4/6/2023 9:53:00 PM"
end = "4/7/2023 3:31:00 PM"
run(start, end)

start = "4/6/2023 7:03:00 PM"
end = "4/7/2023 3:31:00 AM"
run(start, end)

start = "4/20/2023 1:55:00 PM"
end = "4/20/2023 10:05:00 PM"
run(start, end)


sheet: pd.DataFrame = pd.read_excel("Timesheets - Apr 16 - Apr 29, 2023.xlsx", sheet_name="Entries", parse_dates=["Date", "Start Time", "End Time"], usecols=["First Name", "Last Name", "Date", "Start Time", "End Time", "Regular", "Schedule", "OT"])
print(sheet)

data = {}
for idx, row in sheet.iterrows():
    start, end = pd.to_datetime(row["Start Time"]).replace(second=0), pd.to_datetime(row["End Time"])
    resp = run(start, end, row)
    # minutes, hours, day_minutes, day_hours, night_minutes, night_hours = resp
    data[row["First Name"] + " " + row["Last Name"] + f" {idx+2:02}"] = resp

# pprint(data)