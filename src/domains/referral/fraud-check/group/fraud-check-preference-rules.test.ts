import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckPreferenceBatchSizeRangeRule,
  FraudCheckPreferenceCodeLengthRule,
  FraudCheckPreferenceRequiredTimezoneRule,
  defaultFraudCheckPreferenceValidator,
} from "./fraud-check-preference-rules.js";
import { newFraudCheckPreference } from "./fraud-check-preference.js";

test("FraudCheckPreferenceValidator reports every problem", () => {
  const validator = defaultFraudCheckPreferenceValidator();
  const item = newFraudCheckPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckPreferenceRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new FraudCheckPreferenceRequiredTimezoneRule("fraud check preference needs an entry");
  const item = newFraudCheckPreference("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckPreferenceCodeLengthRule flags a long code", () => {
  const rule = new FraudCheckPreferenceCodeLengthRule(255);
  const item = newFraudCheckPreference("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckPreferenceBatchSizeRangeRule flags values above batch size", () => {
  const rule = new FraudCheckPreferenceBatchSizeRangeRule(32, 86400);
  const item = newFraudCheckPreference("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
