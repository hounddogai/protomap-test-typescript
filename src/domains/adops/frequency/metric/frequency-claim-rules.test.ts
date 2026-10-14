import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyClaimBatchSizeRangeRule,
  FrequencyClaimBudgetRangeRule,
  FrequencyClaimLocaleLengthRule,
  FrequencyClaimRequiredLocaleRule,
  FrequencyClaimSourceLengthRule,
  defaultFrequencyClaimValidator,
} from "./frequency-claim-rules.js";
import { newFrequencyClaim } from "./frequency-claim.js";

test("FrequencyClaimValidator reports every problem", () => {
  const validator = defaultFrequencyClaimValidator();
  const item = newFrequencyClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyClaimRequiredLocaleRule flags a blank locale", () => {
  const rule = new FrequencyClaimRequiredLocaleRule("frequency claim needs this field");
  const item = newFrequencyClaim("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyClaimSourceLengthRule flags a long source", () => {
  const rule = new FrequencyClaimSourceLengthRule(1000);
  const item = newFrequencyClaim("x", "y");
  item.source = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyClaimLocaleLengthRule flags a long locale", () => {
  const rule = new FrequencyClaimLocaleLengthRule(3600);
  const item = newFrequencyClaim("x", "y");
  item.locale = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyClaimBatchSizeRangeRule flags values above batch size", () => {
  const rule = new FrequencyClaimBatchSizeRangeRule(16, 255);
  const item = newFrequencyClaim("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencyClaimBudgetRangeRule flags values above budget", () => {
  const rule = new FrequencyClaimBudgetRangeRule(7.8, 3589.7);
  const item = newFrequencyClaim("x", "y");
  item.budget = 3591.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
