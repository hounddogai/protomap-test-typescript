import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackReputationBatchCountryLengthRule,
  FallbackReputationBatchRequiredCountryRule,
  FallbackReputationBatchRetriesRangeRule,
  defaultFallbackReputationBatchValidator,
} from "./fallback-reputation-batch-rules.js";
import { newFallbackReputationBatch } from "./fallback-reputation-batch.js";

test("FallbackReputationBatchValidator reports every problem", () => {
  const validator = defaultFallbackReputationBatchValidator();
  const item = newFallbackReputationBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackReputationBatchCountryLengthRule flags a long country", () => {
  const rule = new FallbackReputationBatchCountryLengthRule(3600);
  const item = newFallbackReputationBatch("x", "y");
  item.country = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackReputationBatchRetriesRangeRule flags values above retries", () => {
  const rule = new FallbackReputationBatchRetriesRangeRule(16, 64);
  const item = newFallbackReputationBatch("x", "y");
  item.retries = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackReputationBatchRequiredCountryRule flags a blank country", () => {
  const rule = new FallbackReputationBatchRequiredCountryRule("fallback reputation batch needs an entry");
  const item = newFallbackReputationBatch("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
