import moment from "moment";
import { runPayroll } from "../hooks/usePayroll";
import { isDay, isNight, toDateRange } from "../utils/utils";
import {
  payrollTestData,
  payRateTestDataConverted,
  timesheetTestDataConverted,
} from "./timesheet_dec10_dec23_2023";

describe("usePayroll", () => {
  test("runPayroll", () => {
    const [payrollHours, payrollDollars] = runPayroll(
      payRateTestDataConverted,
      timesheetTestDataConverted
    );

    payrollHours.forEach((payrollItem) => {
      const testItem = payrollTestData.find(
        (item) =>
          item.firstName === payrollItem.firstName &&
          item.lastName === payrollItem.lastName
      );
      expect(testItem).toMatchObject(payrollItem);
    });
  });
});

describe.each([
  [2022, 6],
  [2023, 7],
  [2024, 8],
  [2025, 10],
])("getWeek: %s", (year, dow) => {
  const dates = toDateRange(
    moment.utc(new Date(year, 0, 1, 0, 0, 0, 0)),
    moment.utc(new Date(year + 1, 0, 1, 0, 0, 0, 0)),
    "days"
  );

  test.each(dates)("%s", (date) => {
    const count = dates.indexOf(date) + dow;
    let expected = Math.floor(count / 7);
    let week = date.isoWeek();

    if (expected === 53) {
      expect(week).toBe(1);
    } else if (expected === 0) {
      expect(week).toBe(52);
    } else {
      expect(week).toBe(expected);
    }
  });
});

describe("toDateRange", () => {
  test("3 days", () => {
    const start = moment.utc(new Date(2023, 11, 10, 0, 0, 0, 0));
    const end = moment.utc(new Date(2023, 11, 13, 0, 0, 0, 0));
    const range = toDateRange(start, end);
    expect(range).toHaveLength(3 * 24 * 60);
  });

  test("12 minutes", () => {
    const start = moment.utc(new Date(2023, 11, 10, 0, 0, 0, 0));
    const end = moment.utc(new Date(2023, 11, 10, 0, 12, 0, 0));
    const range = toDateRange(start, end);
    expect(range).toHaveLength(12);
  });

  test("12 minutes with start seconds", () => {
    const start = moment.utc(new Date(2023, 11, 10, 0, 0, 10, 0));
    const end = moment.utc(new Date(2023, 11, 10, 0, 12, 0, 0));
    const range = toDateRange(start, end);
    expect(range).toHaveLength(12);
  });

  test("other to date range", () => {
    expect(
      toDateRange(
        moment.utc("2021-01-01T00:00:00"),
        moment.utc("2021-01-01T00:00:10")
      )
    ).toHaveLength(0);
    expect(
      toDateRange(
        moment.utc("2021-01-01T00:00:00"),
        moment.utc("2021-01-01T00:00:59")
      )
    ).toHaveLength(0);
    expect(
      toDateRange(
        moment.utc("2021-01-01T00:00:00"),
        moment.utc("2021-01-01T00:01:00")
      )
    ).toHaveLength(1);
    expect(
      toDateRange(
        moment.utc("2021-01-01T00:00:00"),
        moment.utc("2021-01-01T00:10:00")
      )
    ).toHaveLength(10);
    expect(
      toDateRange(
        moment.utc("2021-01-01T00:00:00"),
        moment.utc("2021-01-01T01:00:00")
      )
    ).toHaveLength(60);
    expect(
      toDateRange(
        moment.utc("2021-01-01T00:00:00"),
        moment.utc("2021-01-01T10:00:00")
      )
    ).toHaveLength(60 * 10);
    expect(
      toDateRange(
        moment.utc("2021-01-01T00:00:00"),
        moment.utc("2021-01-02T00:00:00")
      )
    ).toHaveLength(24 * 60);
    expect(
      toDateRange(
        moment.utc("2021-01-01T00:00:00"),
        moment.utc("2021-02-01T00:00:00")
      )
    ).toHaveLength(31 * 24 * 60);
  });

  test("Abby Ehiede First shift Date Range Size", () => {
    const firstDateRangeByAbbyEhiede = toDateRange(
      moment.utc("2023-12-12T21:55:00"),
      moment.utc("2023-12-13T09:48:00")
    );
    expect(firstDateRangeByAbbyEhiede).toHaveLength(713); // 5 + (11 * 60) + 48 = 713
  });

  test("Abby Ehiede First shift Date Range, Check last element", () => {
    const firstDateRangeByAbbyEhiede = toDateRange(
      moment.utc("2023-12-12T21:55:00"),
      moment.utc("2023-12-13T09:48:00")
    );
    expect(
      firstDateRangeByAbbyEhiede[
        firstDateRangeByAbbyEhiede.length - 1
      ].toISOString()
    ).toEqual(moment.utc("2023-12-13T09:47:00").toISOString());
  });
});

describe("date utils", () => {
  test.each(Array.from({ length: 24 }, (_, i) => i))("isDay: %d", (i) => {
    const date = moment.utc("2023-12-10T00:00:00").add(i, "hours");
    expect(isDay(date)).toEqual(i >= 6 && i < 22);
  });

  test.each(Array.from({ length: 24 }, (_, i) => i))("isNight: %d", (i) => {
    const date = moment.utc("2023-12-10T00:00:00").add(i, "hours");
    expect(isNight(date)).toEqual(i < 6 || i >= 22);
  });
});
