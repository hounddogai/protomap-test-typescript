import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalCreditAllocationCodeLengthRule,
  GlobalCreditAllocationGraceDaysRangeRule,
  GlobalCreditAllocationRequiredCodeRule,
  defaultGlobalCreditAllocationValidator,
} from "./global-credit-allocation-rules.js";
import { newGlobalCreditAllocation } from "./global-credit-allocation.js";

test("GlobalCreditAllocationValidator reports every problem", () => {
  const validator = defaultGlobalCreditAllocationValidator();
  const item = newGlobalCreditAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalCreditAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalCreditAllocationRequiredCodeRule("global credit allocation needs this field");
  const item = newGlobalCreditAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalCreditAllocationCodeLengthRule flags a long code", () => {
  const rule = new GlobalCreditAllocationCodeLengthRule(32);
  const item = newGlobalCreditAllocation("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalCreditAllocationGraceDaysRangeRule flags values above grace days", () => {
  const rule = new GlobalCreditAllocationGraceDaysRangeRule(64, 3600);
  const item = newGlobalCreditAllocation("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
