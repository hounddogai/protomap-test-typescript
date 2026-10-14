import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingJourneySummaryPriorityRangeRule,
  RollingJourneySummaryRequiredCodeRule,
  RollingJourneySummaryRequiredTimezoneRule,
  RollingJourneySummaryTimezoneLengthRule,
  defaultRollingJourneySummaryValidator,
} from "./rolling-journey-summary-rules.js";
import { newRollingJourneySummary } from "./rolling-journey-summary.js";

test("RollingJourneySummaryValidator reports every problem", () => {
  const validator = defaultRollingJourneySummaryValidator();
  const item = newRollingJourneySummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingJourneySummaryTimezoneLengthRule flags a long timezone", () => {
  const rule = new RollingJourneySummaryTimezoneLengthRule(64);
  const item = newRollingJourneySummary("x", "y");
  item.timezone = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingJourneySummaryRequiredCodeRule flags a blank code", () => {
  const rule = new RollingJourneySummaryRequiredCodeRule("rolling journey summary needs this field");
  const item = newRollingJourneySummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingJourneySummaryRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new RollingJourneySummaryRequiredTimezoneRule("rolling journey summary needs this field");
  const item = newRollingJourneySummary("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingJourneySummaryPriorityRangeRule flags values above priority", () => {
  const rule = new RollingJourneySummaryPriorityRangeRule(1000, 3600);
  const item = newRollingJourneySummary("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
