# GoalHome

```py
((minutes > day_start) & (minutes < day_end))
```
```
>  <     Don't want to exclude both
>  <=    Off in Day_OT, but is the one i want
>= <     Best!!
>= <=    Don't want to include both
```

## Night_OT Pay
`Only off due to not rounding at Dollar calculation (g["Night Rate"] * 1.5) * g["Night_OT"]`

## A Table
| Last Name  | First Name  |  Day    |  Day Pay |  Night  |  Night Pay |  Day_OT | Day_OT Pay | Night_OT | Night_OT Pay | Paddington Bonus |   Pay    | Pay_OT | Total Hours | Total Pay |
| ---------- | ----------- | ------- | -------- | ------- | ---------- | ------- | ---------- | -------- | ------------ | ---------------- | -------- | ------ | ----------- | --------- |
| SEALII     | FANNY       |  57.9   |  1273.8  |  22.1   |   353.6    |  [8.05] |  [265.65]  |  [2.12]  |    [50.8_]   | [0.0]            |  1627.4  | 316.45 |    90.17    |  1943.85  |
| SEALII     | FANNY       | [57.95] | [1274.9] | [22.05] |  [352.8]   |   8.08  |   266.75   |   2.08   |     50.0     | [0.0]            | [1627.7] | 316.75 |    90.17    |  1944.45  |
| SEALII     | FANNY       | [57.95] | [1274.9] | [22.05] |  [352.8]   |  [8.05] |  [265.65]  |  [2.12]  |    [50.8_]   | [0.0]            | [1627.7] | 316.45 |    90.17    |  1944.15  |
| SEALII     | FANNY       |  58.0   |  1276.0  |  22.0   |   352.0    |   8.08  |   266.75   |   2.08   |     50.0     | [0.0]            |  1628.0  | 316.75 |    90.17    |  1944.75  |


## Night_OT rounded here
`(g["Night Rate"] * 1.5) * g["Night_OT"].round(2)`

SEALII      FANNY   1274.9      265.65      352.8         50.88  1627.7  316.53  57.95    8.05  22.05     2.117               0.0       90.167    1944.23

## Rounded here
`Within calcWeek return pd.Series(...).round(2)`

## THIS IS PERFECT!!!!
SEALII      FANNY   1274.9      265.65      352.8         50.88  1627.7  316.53  57.95    8.05  22.05      2.12               0.0        90.17    1944.23



1. color full indicators
1. full name column
1. charts and graphs. Overtime? or just compare/show how much each person made this pay period