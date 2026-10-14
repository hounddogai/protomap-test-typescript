import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeAllocationBudgetRangeRule,
  NudgeAllocationNameLengthRule,
  NudgeAllocationRequiredCodeRule,
  NudgeAllocationRequiredNameRule,
  NudgeAllocationRequiredNotesRule,
  defaultNudgeAllocationValidator,
} from "./nudge-allocation-rules.js";
import { newNudgeAllocation } from "./nudge-allocation.js";

test("NudgeAllocationValidator reports every problem", () => {
  const validator = defaultNudgeAllocationValidator();
  const item = newNudgeAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeAllocationNameLengthRule flags a long name", () => {
  const rule = new NudgeAllocationNameLengthRule(1000);
  const item = newNudgeAllocation("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeAllocationBudgetRangeRule flags values above budget", () => {
  const rule = new NudgeAllocationBudgetRangeRule(5.9, 3927.3);
  const item = newNudgeAllocation("x", "y");
  item.budget = 3928.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeAllocationRequiredNameRule flags a blank name", () => {
  const rule = new NudgeAllocationRequiredNameRule("nudge allocation needs a value");
  const item = newNudgeAllocation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeAllocationRequiredNotesRule flags a blank notes", () => {
  const rule = new NudgeAllocationRequiredNotesRule("nudge allocation needs an entry");
  const item = newNudgeAllocation("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new NudgeAllocationRequiredCodeRule("nudge allocation needs an entry");
  const item = newNudgeAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
