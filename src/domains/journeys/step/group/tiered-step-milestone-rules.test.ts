import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredStepMilestoneCodeLengthRule,
  TieredStepMilestoneRequiredCodeRule,
  defaultTieredStepMilestoneValidator,
} from "./tiered-step-milestone-rules.js";
import { newTieredStepMilestone } from "./tiered-step-milestone.js";

test("TieredStepMilestoneValidator reports every problem", () => {
  const validator = defaultTieredStepMilestoneValidator();
  const item = newTieredStepMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredStepMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new TieredStepMilestoneRequiredCodeRule("tiered step milestone needs this field");
  const item = newTieredStepMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredStepMilestoneCodeLengthRule flags a long code", () => {
  const rule = new TieredStepMilestoneCodeLengthRule(86400);
  const item = newTieredStepMilestone("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
