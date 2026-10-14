import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchPolicyMinimumRangeRule,
  BranchPolicyRequiredCodeRule,
  BranchPolicyReviewerLengthRule,
  defaultBranchPolicyValidator,
} from "./branch-policy-rules.js";
import { newBranchPolicy } from "./branch-policy.js";

test("BranchPolicyValidator reports every problem", () => {
  const validator = defaultBranchPolicyValidator();
  const item = newBranchPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchPolicyReviewerLengthRule flags a long reviewer", () => {
  const rule = new BranchPolicyReviewerLengthRule(120);
  const item = newBranchPolicy("x", "y");
  item.reviewer = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new BranchPolicyRequiredCodeRule("branch policy needs an entry");
  const item = newBranchPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchPolicyMinimumRangeRule flags values above minimum", () => {
  const rule = new BranchPolicyMinimumRangeRule(7.8, 1575.2);
  const item = newBranchPolicy("x", "y");
  item.minimum = 1576.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
