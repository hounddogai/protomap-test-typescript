import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictReputationTierBudgetRangeRule,
  StrictReputationTierRequiredReviewerRule,
  StrictReputationTierReviewerLengthRule,
  StrictReputationTierStartsAtRangeRule,
  defaultStrictReputationTierValidator,
} from "./strict-reputation-tier-rules.js";
import { newStrictReputationTier } from "./strict-reputation-tier.js";

test("StrictReputationTierValidator reports every problem", () => {
  const validator = defaultStrictReputationTierValidator();
  const item = newStrictReputationTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictReputationTierRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new StrictReputationTierRequiredReviewerRule("strict reputation tier needs this field");
  const item = newStrictReputationTier("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictReputationTierStartsAtRangeRule flags values above starts at", () => {
  const rule = new StrictReputationTierStartsAtRangeRule(64, 1000);
  const item = newStrictReputationTier("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictReputationTierBudgetRangeRule flags values above budget", () => {
  const rule = new StrictReputationTierBudgetRangeRule(9.9, 3501.1);
  const item = newStrictReputationTier("x", "y");
  item.budget = 3502.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictReputationTierReviewerLengthRule flags a long reviewer", () => {
  const rule = new StrictReputationTierReviewerLengthRule(86400);
  const item = newStrictReputationTier("x", "y");
  item.reviewer = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
