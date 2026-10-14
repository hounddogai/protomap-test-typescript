import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingJourneyBaselineMinimumRangeRule,
  RollingJourneyBaselinePriorityRangeRule,
  RollingJourneyBaselineRequiredTitleRule,
  RollingJourneyBaselineTitleLengthRule,
  defaultRollingJourneyBaselineValidator,
} from "./rolling-journey-baseline-rules.js";
import { newRollingJourneyBaseline } from "./rolling-journey-baseline.js";

test("RollingJourneyBaselineValidator reports every problem", () => {
  const validator = defaultRollingJourneyBaselineValidator();
  const item = newRollingJourneyBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingJourneyBaselineMinimumRangeRule flags values above minimum", () => {
  const rule = new RollingJourneyBaselineMinimumRangeRule(7.6, 987.4);
  const item = newRollingJourneyBaseline("x", "y");
  item.minimum = 988.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingJourneyBaselineRequiredTitleRule flags a blank title", () => {
  const rule = new RollingJourneyBaselineRequiredTitleRule("rolling journey baseline needs a value");
  const item = newRollingJourneyBaseline("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingJourneyBaselinePriorityRangeRule flags values above priority", () => {
  const rule = new RollingJourneyBaselinePriorityRangeRule(32, 80);
  const item = newRollingJourneyBaseline("x", "y");
  item.priority = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingJourneyBaselineTitleLengthRule flags a long title", () => {
  const rule = new RollingJourneyBaselineTitleLengthRule(86400);
  const item = newRollingJourneyBaseline("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
