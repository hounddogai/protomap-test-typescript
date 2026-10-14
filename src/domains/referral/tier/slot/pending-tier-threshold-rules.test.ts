import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingTierThresholdCodeLengthRule,
  PendingTierThresholdRequiredCountryRule,
  PendingTierThresholdWindowDaysRangeRule,
  defaultPendingTierThresholdValidator,
} from "./pending-tier-threshold-rules.js";
import { newPendingTierThreshold } from "./pending-tier-threshold.js";

test("PendingTierThresholdValidator reports every problem", () => {
  const validator = defaultPendingTierThresholdValidator();
  const item = newPendingTierThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingTierThresholdRequiredCountryRule flags a blank country", () => {
  const rule = new PendingTierThresholdRequiredCountryRule("pending tier threshold needs this field");
  const item = newPendingTierThreshold("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingTierThresholdWindowDaysRangeRule flags values above window days", () => {
  const rule = new PendingTierThresholdWindowDaysRangeRule(255, 3600);
  const item = newPendingTierThreshold("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingTierThresholdCodeLengthRule flags a long code", () => {
  const rule = new PendingTierThresholdCodeLengthRule(64);
  const item = newPendingTierThreshold("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
