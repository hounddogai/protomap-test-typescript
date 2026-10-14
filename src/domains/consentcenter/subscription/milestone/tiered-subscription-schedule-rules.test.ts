import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredSubscriptionScheduleDiscountRangeRule,
  TieredSubscriptionScheduleFrequencyCapRangeRule,
  TieredSubscriptionScheduleMarginRangeRule,
  TieredSubscriptionScheduleRequiredTimezoneRule,
  TieredSubscriptionScheduleTimezoneLengthRule,
  defaultTieredSubscriptionScheduleValidator,
} from "./tiered-subscription-schedule-rules.js";
import { newTieredSubscriptionSchedule } from "./tiered-subscription-schedule.js";

test("TieredSubscriptionScheduleValidator reports every problem", () => {
  const validator = defaultTieredSubscriptionScheduleValidator();
  const item = newTieredSubscriptionSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredSubscriptionScheduleRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new TieredSubscriptionScheduleRequiredTimezoneRule("tiered subscription schedule needs this field");
  const item = newTieredSubscriptionSchedule("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredSubscriptionScheduleDiscountRangeRule flags values above discount", () => {
  const rule = new TieredSubscriptionScheduleDiscountRangeRule(5.5, 1803.6);
  const item = newTieredSubscriptionSchedule("x", "y");
  item.discount = 1805.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredSubscriptionScheduleFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new TieredSubscriptionScheduleFrequencyCapRangeRule(255, 3600);
  const item = newTieredSubscriptionSchedule("x", "y");
  item.frequencyCap = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredSubscriptionScheduleMarginRangeRule flags values above margin", () => {
  const rule = new TieredSubscriptionScheduleMarginRangeRule(5.1, 2432.6);
  const item = newTieredSubscriptionSchedule("x", "y");
  item.margin = 2434.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredSubscriptionScheduleTimezoneLengthRule flags a long timezone", () => {
  const rule = new TieredSubscriptionScheduleTimezoneLengthRule(255);
  const item = newTieredSubscriptionSchedule("x", "y");
  item.timezone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
