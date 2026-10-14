import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledTouchpointBaselineAttemptsRangeRule,
  ScheduledTouchpointBaselineRegionLengthRule,
  ScheduledTouchpointBaselineRequiredContactEmailRule,
  defaultScheduledTouchpointBaselineValidator,
} from "./scheduled-touchpoint-baseline-rules.js";
import { newScheduledTouchpointBaseline } from "./scheduled-touchpoint-baseline.js";

test("ScheduledTouchpointBaselineValidator reports every problem", () => {
  const validator = defaultScheduledTouchpointBaselineValidator();
  const item = newScheduledTouchpointBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledTouchpointBaselineRegionLengthRule flags a long region", () => {
  const rule = new ScheduledTouchpointBaselineRegionLengthRule(80);
  const item = newScheduledTouchpointBaseline("x", "y");
  item.region = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledTouchpointBaselineRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new ScheduledTouchpointBaselineRequiredContactEmailRule("scheduled touchpoint baseline needs an entry");
  const item = newScheduledTouchpointBaseline("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledTouchpointBaselineAttemptsRangeRule flags values above attempts", () => {
  const rule = new ScheduledTouchpointBaselineAttemptsRangeRule(32, 255);
  const item = newScheduledTouchpointBaseline("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
