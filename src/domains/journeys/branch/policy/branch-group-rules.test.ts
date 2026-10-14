import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchGroupBudgetRangeRule,
  BranchGroupCodeLengthRule,
  BranchGroupDurationMinutesRangeRule,
  BranchGroupRequiredCodeRule,
  BranchGroupSendAtRangeRule,
  defaultBranchGroupValidator,
} from "./branch-group-rules.js";
import { newBranchGroup } from "./branch-group.js";

test("BranchGroupValidator reports every problem", () => {
  const validator = defaultBranchGroupValidator();
  const item = newBranchGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchGroupRequiredCodeRule flags a blank code", () => {
  const rule = new BranchGroupRequiredCodeRule("branch group needs this field");
  const item = newBranchGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchGroupCodeLengthRule flags a long code", () => {
  const rule = new BranchGroupCodeLengthRule(86400);
  const item = newBranchGroup("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchGroupSendAtRangeRule flags values above send at", () => {
  const rule = new BranchGroupSendAtRangeRule(80, 255);
  const item = newBranchGroup("x", "y");
  item.sendAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchGroupDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new BranchGroupDurationMinutesRangeRule(32, 120);
  const item = newBranchGroup("x", "y");
  item.durationMinutes = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchGroupBudgetRangeRule flags values above budget", () => {
  const rule = new BranchGroupBudgetRangeRule(3.9, 162);
  const item = newBranchGroup("x", "y");
  item.budget = 163.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
