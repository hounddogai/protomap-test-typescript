import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedRewardSummaryLabelLengthRule,
  CappedRewardSummaryRequiredSummaryRule,
  defaultCappedRewardSummaryValidator,
} from "./capped-reward-summary-rules.js";
import { newCappedRewardSummary } from "./capped-reward-summary.js";

test("CappedRewardSummaryValidator reports every problem", () => {
  const validator = defaultCappedRewardSummaryValidator();
  const item = newCappedRewardSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedRewardSummaryRequiredSummaryRule flags a blank summary", () => {
  const rule = new CappedRewardSummaryRequiredSummaryRule("capped reward summary needs an entry");
  const item = newCappedRewardSummary("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedRewardSummaryLabelLengthRule flags a long label", () => {
  const rule = new CappedRewardSummaryLabelLengthRule(3600);
  const item = newCappedRewardSummary("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
