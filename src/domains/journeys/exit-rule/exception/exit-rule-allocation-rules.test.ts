import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleAllocationFloorValueRangeRule,
  ExitRuleAllocationRequiredTitleRule,
  ExitRuleAllocationTitleLengthRule,
  defaultExitRuleAllocationValidator,
} from "./exit-rule-allocation-rules.js";
import { newExitRuleAllocation } from "./exit-rule-allocation.js";

test("ExitRuleAllocationValidator reports every problem", () => {
  const validator = defaultExitRuleAllocationValidator();
  const item = newExitRuleAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleAllocationRequiredTitleRule flags a blank title", () => {
  const rule = new ExitRuleAllocationRequiredTitleRule("exit rule allocation needs a value");
  const item = newExitRuleAllocation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleAllocationTitleLengthRule flags a long title", () => {
  const rule = new ExitRuleAllocationTitleLengthRule(1000);
  const item = newExitRuleAllocation("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleAllocationFloorValueRangeRule flags values above floor value", () => {
  const rule = new ExitRuleAllocationFloorValueRangeRule(4.7, 2994.8);
  const item = newExitRuleAllocation("x", "y");
  item.floorValue = 2996.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
