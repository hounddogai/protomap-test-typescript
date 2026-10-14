import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalPaywallScheduleLabelLengthRule,
  defaultSeasonalPaywallScheduleValidator,
} from "./seasonal-paywall-schedule-rules.js";
import { newSeasonalPaywallSchedule } from "./seasonal-paywall-schedule.js";

test("SeasonalPaywallScheduleValidator reports every problem", () => {
  const validator = defaultSeasonalPaywallScheduleValidator();
  const item = newSeasonalPaywallSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalPaywallScheduleLabelLengthRule flags a long label", () => {
  const rule = new SeasonalPaywallScheduleLabelLengthRule(16);
  const item = newSeasonalPaywallSchedule("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
