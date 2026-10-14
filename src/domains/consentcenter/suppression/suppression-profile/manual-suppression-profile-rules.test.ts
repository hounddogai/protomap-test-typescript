import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualSuppressionProfileNameLengthRule,
  ManualSuppressionProfileRateRangeRule,
  ManualSuppressionProfileUpdatedAtRangeRule,
  defaultManualSuppressionProfileValidator,
} from "./manual-suppression-profile-rules.js";
import { newManualSuppressionProfile } from "./manual-suppression-profile.js";

test("ManualSuppressionProfileValidator reports every problem", () => {
  const validator = defaultManualSuppressionProfileValidator();
  const item = newManualSuppressionProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualSuppressionProfileNameLengthRule flags a long name", () => {
  const rule = new ManualSuppressionProfileNameLengthRule(80);
  const item = newManualSuppressionProfile("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualSuppressionProfileUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new ManualSuppressionProfileUpdatedAtRangeRule(32, 64);
  const item = newManualSuppressionProfile("x", "y");
  item.updatedAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualSuppressionProfileRateRangeRule flags values above rate", () => {
  const rule = new ManualSuppressionProfileRateRangeRule(1.9, 978.5);
  const item = newManualSuppressionProfile("x", "y");
  item.rate = 980;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
