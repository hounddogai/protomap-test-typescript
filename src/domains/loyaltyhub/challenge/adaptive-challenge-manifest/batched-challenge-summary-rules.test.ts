import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedChallengeSummaryClicksRangeRule,
  BatchedChallengeSummaryCohortLengthRule,
  BatchedChallengeSummaryCurrencyLengthRule,
  BatchedChallengeSummaryRequiredCurrencyRule,
  defaultBatchedChallengeSummaryValidator,
} from "./batched-challenge-summary-rules.js";
import { newBatchedChallengeSummary } from "./batched-challenge-summary.js";

test("BatchedChallengeSummaryValidator reports every problem", () => {
  const validator = defaultBatchedChallengeSummaryValidator();
  const item = newBatchedChallengeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedChallengeSummaryCurrencyLengthRule flags a long currency", () => {
  const rule = new BatchedChallengeSummaryCurrencyLengthRule(86400);
  const item = newBatchedChallengeSummary("x", "y");
  item.currency = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedChallengeSummaryClicksRangeRule flags values above clicks", () => {
  const rule = new BatchedChallengeSummaryClicksRangeRule(64, 80);
  const item = newBatchedChallengeSummary("x", "y");
  item.clicks = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedChallengeSummaryCohortLengthRule flags a long cohort", () => {
  const rule = new BatchedChallengeSummaryCohortLengthRule(3600);
  const item = newBatchedChallengeSummary("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedChallengeSummaryRequiredCurrencyRule flags a blank currency", () => {
  const rule = new BatchedChallengeSummaryRequiredCurrencyRule("batched challenge summary needs a value");
  const item = newBatchedChallengeSummary("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
