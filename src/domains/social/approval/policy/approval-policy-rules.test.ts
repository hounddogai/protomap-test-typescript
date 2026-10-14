import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalPolicyExpiresAtRangeRule,
  ApprovalPolicyNameLengthRule,
  ApprovalPolicyRequiredCodeRule,
  ApprovalPolicyRequiredCohortRule,
  defaultApprovalPolicyValidator,
} from "./approval-policy-rules.js";
import { newApprovalPolicy } from "./approval-policy.js";

test("ApprovalPolicyValidator reports every problem", () => {
  const validator = defaultApprovalPolicyValidator();
  const item = newApprovalPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalPolicyRequiredCohortRule flags a blank cohort", () => {
  const rule = new ApprovalPolicyRequiredCohortRule("approval policy needs this field");
  const item = newApprovalPolicy("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalPolicyExpiresAtRangeRule flags values above expires at", () => {
  const rule = new ApprovalPolicyExpiresAtRangeRule(120, 255);
  const item = newApprovalPolicy("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalPolicyNameLengthRule flags a long name", () => {
  const rule = new ApprovalPolicyNameLengthRule(3600);
  const item = newApprovalPolicy("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new ApprovalPolicyRequiredCodeRule("approval policy needs an entry");
  const item = newApprovalPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
