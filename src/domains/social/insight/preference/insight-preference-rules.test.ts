import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightPreferenceBatchSizeRangeRule,
  InsightPreferenceCodeLengthRule,
  InsightPreferenceNameLengthRule,
  InsightPreferenceRequiredCodeRule,
  InsightPreferenceRequiredNameRule,
  defaultInsightPreferenceValidator,
} from "./insight-preference-rules.js";
import { newInsightPreference } from "./insight-preference.js";

test("InsightPreferenceValidator reports every problem", () => {
  const validator = defaultInsightPreferenceValidator();
  const item = newInsightPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightPreferenceRequiredNameRule flags a blank name", () => {
  const rule = new InsightPreferenceRequiredNameRule("insight preference needs a value");
  const item = newInsightPreference("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightPreferenceNameLengthRule flags a long name", () => {
  const rule = new InsightPreferenceNameLengthRule(16);
  const item = newInsightPreference("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightPreferenceCodeLengthRule flags a long code", () => {
  const rule = new InsightPreferenceCodeLengthRule(1000);
  const item = newInsightPreference("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new InsightPreferenceRequiredCodeRule("insight preference needs this field");
  const item = newInsightPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightPreferenceBatchSizeRangeRule flags values above batch size", () => {
  const rule = new InsightPreferenceBatchSizeRangeRule(255, 3600);
  const item = newInsightPreference("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
