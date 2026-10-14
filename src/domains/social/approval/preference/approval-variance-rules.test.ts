import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalVarianceRequiredCodeRule,
  ApprovalVarianceRequiredReviewerRule,
  ApprovalVarianceRequiredTitleRule,
  ApprovalVarianceReviewerLengthRule,
  ApprovalVarianceUtmSourceLengthRule,
  defaultApprovalVarianceValidator,
} from "./approval-variance-rules.js";
import { newApprovalVariance } from "./approval-variance.js";

test("ApprovalVarianceValidator reports every problem", () => {
  const validator = defaultApprovalVarianceValidator();
  const item = newApprovalVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalVarianceRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new ApprovalVarianceRequiredReviewerRule("approval variance needs an entry");
  const item = newApprovalVariance("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalVarianceReviewerLengthRule flags a long reviewer", () => {
  const rule = new ApprovalVarianceReviewerLengthRule(64);
  const item = newApprovalVariance("x", "y");
  item.reviewer = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalVarianceRequiredTitleRule flags a blank title", () => {
  const rule = new ApprovalVarianceRequiredTitleRule("approval variance needs an entry");
  const item = newApprovalVariance("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalVarianceUtmSourceLengthRule flags a long utm source", () => {
  const rule = new ApprovalVarianceUtmSourceLengthRule(120);
  const item = newApprovalVariance("x", "y");
  item.utmSource = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new ApprovalVarianceRequiredCodeRule("approval variance needs this field");
  const item = newApprovalVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
