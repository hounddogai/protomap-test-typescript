import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingCsatPolicyBidRangeRule,
  PendingCsatPolicyBudgetRangeRule,
  PendingCsatPolicyCodeLengthRule,
  defaultPendingCsatPolicyValidator,
} from "./pending-csat-policy-rules.js";
import { newPendingCsatPolicy } from "./pending-csat-policy.js";

test("PendingCsatPolicyValidator reports every problem", () => {
  const validator = defaultPendingCsatPolicyValidator();
  const item = newPendingCsatPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingCsatPolicyBidRangeRule flags values above bid", () => {
  const rule = new PendingCsatPolicyBidRangeRule(4.6, 1842.8);
  const item = newPendingCsatPolicy("x", "y");
  item.bid = 1844.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingCsatPolicyBudgetRangeRule flags values above budget", () => {
  const rule = new PendingCsatPolicyBudgetRangeRule(3.4, 64.3);
  const item = newPendingCsatPolicy("x", "y");
  item.budget = 65.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingCsatPolicyCodeLengthRule flags a long code", () => {
  const rule = new PendingCsatPolicyCodeLengthRule(255);
  const item = newPendingCsatPolicy("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
