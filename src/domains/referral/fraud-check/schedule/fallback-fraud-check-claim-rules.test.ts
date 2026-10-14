import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackFraudCheckClaimBudgetRangeRule,
  FallbackFraudCheckClaimOwnerIdLengthRule,
  FallbackFraudCheckClaimRequiredOwnerIdRule,
  FallbackFraudCheckClaimTitleLengthRule,
  defaultFallbackFraudCheckClaimValidator,
} from "./fallback-fraud-check-claim-rules.js";
import { newFallbackFraudCheckClaim } from "./fallback-fraud-check-claim.js";

test("FallbackFraudCheckClaimValidator reports every problem", () => {
  const validator = defaultFallbackFraudCheckClaimValidator();
  const item = newFallbackFraudCheckClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackFraudCheckClaimTitleLengthRule flags a long title", () => {
  const rule = new FallbackFraudCheckClaimTitleLengthRule(32);
  const item = newFallbackFraudCheckClaim("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackFraudCheckClaimBudgetRangeRule flags values above budget", () => {
  const rule = new FallbackFraudCheckClaimBudgetRangeRule(9.4, 3282.6);
  const item = newFallbackFraudCheckClaim("x", "y");
  item.budget = 3284.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackFraudCheckClaimOwnerIdLengthRule flags a long owner id", () => {
  const rule = new FallbackFraudCheckClaimOwnerIdLengthRule(3600);
  const item = newFallbackFraudCheckClaim("x", "y");
  item.ownerId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackFraudCheckClaimRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new FallbackFraudCheckClaimRequiredOwnerIdRule("fallback fraud check claim needs a value");
  const item = newFallbackFraudCheckClaim("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
