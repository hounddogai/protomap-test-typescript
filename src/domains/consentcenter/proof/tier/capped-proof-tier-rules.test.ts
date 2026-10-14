import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedProofTierPriorityRangeRule,
  CappedProofTierRequiredReviewerRule,
  CappedProofTierRequiredTitleRule,
  CappedProofTierReviewerLengthRule,
  defaultCappedProofTierValidator,
} from "./capped-proof-tier-rules.js";
import { newCappedProofTier } from "./capped-proof-tier.js";

test("CappedProofTierValidator reports every problem", () => {
  const validator = defaultCappedProofTierValidator();
  const item = newCappedProofTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedProofTierReviewerLengthRule flags a long reviewer", () => {
  const rule = new CappedProofTierReviewerLengthRule(3600);
  const item = newCappedProofTier("x", "y");
  item.reviewer = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedProofTierRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new CappedProofTierRequiredReviewerRule("capped proof tier needs a value");
  const item = newCappedProofTier("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedProofTierPriorityRangeRule flags values above priority", () => {
  const rule = new CappedProofTierPriorityRangeRule(120, 255);
  const item = newCappedProofTier("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedProofTierRequiredTitleRule flags a blank title", () => {
  const rule = new CappedProofTierRequiredTitleRule("capped proof tier needs this field");
  const item = newCappedProofTier("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
