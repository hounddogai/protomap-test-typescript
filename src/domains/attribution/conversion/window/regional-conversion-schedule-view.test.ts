import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalConversionScheduleView,
  toRegionalConversionScheduleViews,
} from "./regional-conversion-schedule-view.js";
import { newRegionalConversionSchedule } from "./regional-conversion-schedule.js";

test("RegionalConversionScheduleView shows the status in capitals", () => {
  const item = newRegionalConversionSchedule("code-412", "name-959");
  const view = toRegionalConversionScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalConversionScheduleViews([item, item]).length, 2, "views");
});
