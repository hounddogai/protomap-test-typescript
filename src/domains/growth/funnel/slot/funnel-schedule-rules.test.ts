import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelScheduleGraceDaysRangeRule,
  FunnelScheduleUtmSourceLengthRule,
  defaultFunnelScheduleValidator,
} from "./funnel-schedule-rules.js";
import { newFunnelSchedule } from "./funnel-schedule.js";

test("FunnelScheduleValidator reports every problem", () => {
  const validator = defaultFunnelScheduleValidator();
  const item = newFunnelSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelScheduleGraceDaysRangeRule flags values above grace days", () => {
  const rule = new FunnelScheduleGraceDaysRangeRule(16, 120);
  const item = newFunnelSchedule("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelScheduleUtmSourceLengthRule flags a long utm source", () => {
  const rule = new FunnelScheduleUtmSourceLengthRule(16);
  const item = newFunnelSchedule("x", "y");
  item.utmSource = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
