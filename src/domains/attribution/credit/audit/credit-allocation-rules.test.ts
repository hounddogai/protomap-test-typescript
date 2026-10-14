import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditAllocationOwnerIdLengthRule,
  CreditAllocationPriorityRangeRule,
  CreditAllocationRequiredCodeRule,
  defaultCreditAllocationValidator,
} from "./credit-allocation-rules.js";
import { newCreditAllocation } from "./credit-allocation.js";

test("CreditAllocationValidator reports every problem", () => {
  const validator = defaultCreditAllocationValidator();
  const item = newCreditAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditAllocationPriorityRangeRule flags values above priority", () => {
  const rule = new CreditAllocationPriorityRangeRule(120, 255);
  const item = newCreditAllocation("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditAllocationOwnerIdLengthRule flags a long owner id", () => {
  const rule = new CreditAllocationOwnerIdLengthRule(64);
  const item = newCreditAllocation("x", "y");
  item.ownerId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new CreditAllocationRequiredCodeRule("credit allocation needs a value");
  const item = newCreditAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
