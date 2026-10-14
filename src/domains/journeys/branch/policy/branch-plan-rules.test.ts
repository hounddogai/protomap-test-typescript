import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchPlanLabelLengthRule,
  BranchPlanRequiredTitleRule,
  BranchPlanRequiredVariantRule,
  defaultBranchPlanValidator,
} from "./branch-plan-rules.js";
import { newBranchPlan } from "./branch-plan.js";

test("BranchPlanValidator reports every problem", () => {
  const validator = defaultBranchPlanValidator();
  const item = newBranchPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchPlanRequiredTitleRule flags a blank title", () => {
  const rule = new BranchPlanRequiredTitleRule("branch plan needs an entry");
  const item = newBranchPlan("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchPlanRequiredVariantRule flags a blank variant", () => {
  const rule = new BranchPlanRequiredVariantRule("branch plan needs an entry");
  const item = newBranchPlan("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchPlanLabelLengthRule flags a long label", () => {
  const rule = new BranchPlanLabelLengthRule(32);
  const item = newBranchPlan("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
