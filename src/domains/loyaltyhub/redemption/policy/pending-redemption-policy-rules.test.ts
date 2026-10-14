import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingRedemptionPolicyBatchSizeRangeRule,
  PendingRedemptionPolicyCodeLengthRule,
  PendingRedemptionPolicyRequiredTitleRule,
  PendingRedemptionPolicyRevisionRangeRule,
  defaultPendingRedemptionPolicyValidator,
} from "./pending-redemption-policy-rules.js";
import { newPendingRedemptionPolicy } from "./pending-redemption-policy.js";

test("PendingRedemptionPolicyValidator reports every problem", () => {
  const validator = defaultPendingRedemptionPolicyValidator();
  const item = newPendingRedemptionPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingRedemptionPolicyRequiredTitleRule flags a blank title", () => {
  const rule = new PendingRedemptionPolicyRequiredTitleRule("pending redemption policy needs this field");
  const item = newPendingRedemptionPolicy("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingRedemptionPolicyRevisionRangeRule flags values above revision", () => {
  const rule = new PendingRedemptionPolicyRevisionRangeRule(1000, 86400);
  const item = newPendingRedemptionPolicy("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingRedemptionPolicyCodeLengthRule flags a long code", () => {
  const rule = new PendingRedemptionPolicyCodeLengthRule(86400);
  const item = newPendingRedemptionPolicy("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingRedemptionPolicyBatchSizeRangeRule flags values above batch size", () => {
  const rule = new PendingRedemptionPolicyBatchSizeRangeRule(120, 3600);
  const item = newPendingRedemptionPolicy("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
