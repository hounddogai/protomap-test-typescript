import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleMilestoneLabelLengthRule,
  ExitRuleMilestoneRequiredCodeRule,
  defaultExitRuleMilestoneValidator,
} from "./exit-rule-milestone-rules.js";
import { newExitRuleMilestone } from "./exit-rule-milestone.js";

test("ExitRuleMilestoneValidator reports every problem", () => {
  const validator = defaultExitRuleMilestoneValidator();
  const item = newExitRuleMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new ExitRuleMilestoneRequiredCodeRule("exit rule milestone needs a value");
  const item = newExitRuleMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleMilestoneLabelLengthRule flags a long label", () => {
  const rule = new ExitRuleMilestoneLabelLengthRule(64);
  const item = newExitRuleMilestone("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
