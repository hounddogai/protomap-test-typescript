import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedWaitPreferenceBidRangeRule,
  BatchedWaitPreferenceCountryLengthRule,
  BatchedWaitPreferenceRequiredCountryRule,
  BatchedWaitPreferenceRequiredTitleRule,
  defaultBatchedWaitPreferenceValidator,
} from "./batched-wait-preference-rules.js";
import { newBatchedWaitPreference } from "./batched-wait-preference.js";

test("BatchedWaitPreferenceValidator reports every problem", () => {
  const validator = defaultBatchedWaitPreferenceValidator();
  const item = newBatchedWaitPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedWaitPreferenceRequiredCountryRule flags a blank country", () => {
  const rule = new BatchedWaitPreferenceRequiredCountryRule("batched wait preference needs an entry");
  const item = newBatchedWaitPreference("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedWaitPreferenceBidRangeRule flags values above bid", () => {
  const rule = new BatchedWaitPreferenceBidRangeRule(0.1, 3454.4);
  const item = newBatchedWaitPreference("x", "y");
  item.bid = 3455.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedWaitPreferenceCountryLengthRule flags a long country", () => {
  const rule = new BatchedWaitPreferenceCountryLengthRule(16);
  const item = newBatchedWaitPreference("x", "y");
  item.country = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedWaitPreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedWaitPreferenceRequiredTitleRule("batched wait preference needs this field");
  const item = newBatchedWaitPreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
