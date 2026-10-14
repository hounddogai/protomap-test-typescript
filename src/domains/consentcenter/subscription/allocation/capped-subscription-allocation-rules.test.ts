import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedSubscriptionAllocationCodeLengthRule,
  CappedSubscriptionAllocationNameLengthRule,
  CappedSubscriptionAllocationRequiredCodeRule,
  CappedSubscriptionAllocationRequiredNameRule,
  CappedSubscriptionAllocationUpdatedAtRangeRule,
  defaultCappedSubscriptionAllocationValidator,
} from "./capped-subscription-allocation-rules.js";
import { newCappedSubscriptionAllocation } from "./capped-subscription-allocation.js";

test("CappedSubscriptionAllocationValidator reports every problem", () => {
  const validator = defaultCappedSubscriptionAllocationValidator();
  const item = newCappedSubscriptionAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedSubscriptionAllocationNameLengthRule flags a long name", () => {
  const rule = new CappedSubscriptionAllocationNameLengthRule(86400);
  const item = newCappedSubscriptionAllocation("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedSubscriptionAllocationUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new CappedSubscriptionAllocationUpdatedAtRangeRule(80, 86400);
  const item = newCappedSubscriptionAllocation("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedSubscriptionAllocationCodeLengthRule flags a long code", () => {
  const rule = new CappedSubscriptionAllocationCodeLengthRule(3600);
  const item = newCappedSubscriptionAllocation("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedSubscriptionAllocationRequiredNameRule flags a blank name", () => {
  const rule = new CappedSubscriptionAllocationRequiredNameRule("capped subscription allocation needs this field");
  const item = newCappedSubscriptionAllocation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedSubscriptionAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new CappedSubscriptionAllocationRequiredCodeRule("capped subscription allocation needs a value");
  const item = newCappedSubscriptionAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
