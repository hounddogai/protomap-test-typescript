import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalTierBatchSizeRangeRule,
  ApprovalTierCohortLengthRule,
  ApprovalTierRequiredSourceRule,
  ApprovalTierTitleLengthRule,
  defaultApprovalTierValidator,
} from "./approval-tier-rules.js";
import { newApprovalTier } from "./approval-tier.js";

test("ApprovalTierValidator reports every problem", () => {
  const validator = defaultApprovalTierValidator();
  const item = newApprovalTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalTierRequiredSourceRule flags a blank source", () => {
  const rule = new ApprovalTierRequiredSourceRule("approval tier needs an entry");
  const item = newApprovalTier("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalTierTitleLengthRule flags a long title", () => {
  const rule = new ApprovalTierTitleLengthRule(64);
  const item = newApprovalTier("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalTierCohortLengthRule flags a long cohort", () => {
  const rule = new ApprovalTierCohortLengthRule(80);
  const item = newApprovalTier("x", "y");
  item.cohort = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalTierBatchSizeRangeRule flags values above batch size", () => {
  const rule = new ApprovalTierBatchSizeRangeRule(1000, 1000);
  const item = newApprovalTier("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
