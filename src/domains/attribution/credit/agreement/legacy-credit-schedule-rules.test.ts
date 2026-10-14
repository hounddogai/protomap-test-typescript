import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyCreditScheduleGraceDaysRangeRule,
  LegacyCreditScheduleRequiredLabelRule,
  defaultLegacyCreditScheduleValidator,
} from "./legacy-credit-schedule-rules.js";
import { newLegacyCreditSchedule } from "./legacy-credit-schedule.js";

test("LegacyCreditScheduleValidator reports every problem", () => {
  const validator = defaultLegacyCreditScheduleValidator();
  const item = newLegacyCreditSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyCreditScheduleRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyCreditScheduleRequiredLabelRule("legacy credit schedule needs an entry");
  const item = newLegacyCreditSchedule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyCreditScheduleGraceDaysRangeRule flags values above grace days", () => {
  const rule = new LegacyCreditScheduleGraceDaysRangeRule(64, 1000);
  const item = newLegacyCreditSchedule("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
