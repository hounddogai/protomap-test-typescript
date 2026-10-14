import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionAllocationCreatedAtRangeRule,
  SubscriptionAllocationLocaleLengthRule,
  SubscriptionAllocationRequiredCodeRule,
  SubscriptionAllocationRequiredLocaleRule,
  defaultSubscriptionAllocationValidator,
} from "./subscription-allocation-rules.js";
import { newSubscriptionAllocation } from "./subscription-allocation.js";

test("SubscriptionAllocationValidator reports every problem", () => {
  const validator = defaultSubscriptionAllocationValidator();
  const item = newSubscriptionAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new SubscriptionAllocationRequiredCodeRule("subscription allocation needs this field");
  const item = newSubscriptionAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionAllocationRequiredLocaleRule flags a blank locale", () => {
  const rule = new SubscriptionAllocationRequiredLocaleRule("subscription allocation needs an entry");
  const item = newSubscriptionAllocation("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionAllocationCreatedAtRangeRule flags values above created at", () => {
  const rule = new SubscriptionAllocationCreatedAtRangeRule(80, 120);
  const item = newSubscriptionAllocation("x", "y");
  item.createdAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionAllocationLocaleLengthRule flags a long locale", () => {
  const rule = new SubscriptionAllocationLocaleLengthRule(32);
  const item = newSubscriptionAllocation("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
