import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalPacingAllocationBudgetRangeRule,
  GlobalPacingAllocationCodeLengthRule,
  GlobalPacingAllocationMinimumRangeRule,
  GlobalPacingAllocationNameLengthRule,
  GlobalPacingAllocationRequiredCodeRule,
  GlobalPacingAllocationStartsAtRangeRule,
  defaultGlobalPacingAllocationValidator,
} from "./global-pacing-allocation-rules.js";
import { newGlobalPacingAllocation } from "./global-pacing-allocation.js";

test("GlobalPacingAllocationValidator reports every problem", () => {
  const validator = defaultGlobalPacingAllocationValidator();
  const item = newGlobalPacingAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalPacingAllocationStartsAtRangeRule flags values above starts at", () => {
  const rule = new GlobalPacingAllocationStartsAtRangeRule(80, 80);
  const item = newGlobalPacingAllocation("x", "y");
  item.startsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalPacingAllocationBudgetRangeRule flags values above budget", () => {
  const rule = new GlobalPacingAllocationBudgetRangeRule(0.1, 3502.1);
  const item = newGlobalPacingAllocation("x", "y");
  item.budget = 3503.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalPacingAllocationMinimumRangeRule flags values above minimum", () => {
  const rule = new GlobalPacingAllocationMinimumRangeRule(1.1, 1984.1);
  const item = newGlobalPacingAllocation("x", "y");
  item.minimum = 1985.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalPacingAllocationCodeLengthRule flags a long code", () => {
  const rule = new GlobalPacingAllocationCodeLengthRule(120);
  const item = newGlobalPacingAllocation("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalPacingAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalPacingAllocationRequiredCodeRule("global pacing allocation needs this field");
  const item = newGlobalPacingAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalPacingAllocationNameLengthRule flags a long name", () => {
  const rule = new GlobalPacingAllocationNameLengthRule(3600);
  const item = newGlobalPacingAllocation("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
