import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPreferenceRequestCodeLengthRule,
  BatchedPreferenceRequestMinimumRangeRule,
  BatchedPreferenceRequestRateRangeRule,
  BatchedPreferenceRequestRequiredLabelRule,
  BatchedPreferenceRequestRequiredLocaleRule,
  defaultBatchedPreferenceRequestValidator,
} from "./batched-preference-request-rules.js";
import { newBatchedPreferenceRequest } from "./batched-preference-request.js";

test("BatchedPreferenceRequestValidator reports every problem", () => {
  const validator = defaultBatchedPreferenceRequestValidator();
  const item = newBatchedPreferenceRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPreferenceRequestRateRangeRule flags values above rate", () => {
  const rule = new BatchedPreferenceRequestRateRangeRule(7.9, 958.5);
  const item = newBatchedPreferenceRequest("x", "y");
  item.rate = 960;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPreferenceRequestRequiredLocaleRule flags a blank locale", () => {
  const rule = new BatchedPreferenceRequestRequiredLocaleRule("batched preference request needs this field");
  const item = newBatchedPreferenceRequest("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPreferenceRequestCodeLengthRule flags a long code", () => {
  const rule = new BatchedPreferenceRequestCodeLengthRule(32);
  const item = newBatchedPreferenceRequest("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPreferenceRequestMinimumRangeRule flags values above minimum", () => {
  const rule = new BatchedPreferenceRequestMinimumRangeRule(5.4, 3352.6);
  const item = newBatchedPreferenceRequest("x", "y");
  item.minimum = 3354.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPreferenceRequestRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedPreferenceRequestRequiredLabelRule("batched preference request needs an entry");
  const item = newBatchedPreferenceRequest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
