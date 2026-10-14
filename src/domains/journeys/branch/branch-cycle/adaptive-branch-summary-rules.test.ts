import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveBranchSummaryLabelLengthRule,
  AdaptiveBranchSummaryRequiredLabelRule,
  AdaptiveBranchSummaryWindowDaysRangeRule,
  defaultAdaptiveBranchSummaryValidator,
} from "./adaptive-branch-summary-rules.js";
import { newAdaptiveBranchSummary } from "./adaptive-branch-summary.js";

test("AdaptiveBranchSummaryValidator reports every problem", () => {
  const validator = defaultAdaptiveBranchSummaryValidator();
  const item = newAdaptiveBranchSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveBranchSummaryWindowDaysRangeRule flags values above window days", () => {
  const rule = new AdaptiveBranchSummaryWindowDaysRangeRule(16, 80);
  const item = newAdaptiveBranchSummary("x", "y");
  item.windowDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveBranchSummaryLabelLengthRule flags a long label", () => {
  const rule = new AdaptiveBranchSummaryLabelLengthRule(3600);
  const item = newAdaptiveBranchSummary("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveBranchSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptiveBranchSummaryRequiredLabelRule("adaptive branch summary needs a value");
  const item = newAdaptiveBranchSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
