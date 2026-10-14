import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationSummaryExpiresAtRangeRule,
  ReputationSummaryFrequencyCapRangeRule,
  ReputationSummaryRequiredCodeRule,
  ReputationSummaryTitleLengthRule,
  defaultReputationSummaryValidator,
} from "./reputation-summary-rules.js";
import { newReputationSummary } from "./reputation-summary.js";

test("ReputationSummaryValidator reports every problem", () => {
  const validator = defaultReputationSummaryValidator();
  const item = newReputationSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new ReputationSummaryRequiredCodeRule("reputation summary needs this field");
  const item = newReputationSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationSummaryTitleLengthRule flags a long title", () => {
  const rule = new ReputationSummaryTitleLengthRule(3600);
  const item = newReputationSummary("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationSummaryFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new ReputationSummaryFrequencyCapRangeRule(120, 86400);
  const item = newReputationSummary("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationSummaryExpiresAtRangeRule flags values above expires at", () => {
  const rule = new ReputationSummaryExpiresAtRangeRule(64, 3600);
  const item = newReputationSummary("x", "y");
  item.expiresAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
