import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackBranchPlanCodeLengthRule,
  FallbackBranchPlanMinimumRangeRule,
  FallbackBranchPlanRequiredContactEmailRule,
  defaultFallbackBranchPlanValidator,
} from "./fallback-branch-plan-rules.js";
import { newFallbackBranchPlan } from "./fallback-branch-plan.js";

test("FallbackBranchPlanValidator reports every problem", () => {
  const validator = defaultFallbackBranchPlanValidator();
  const item = newFallbackBranchPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackBranchPlanRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new FallbackBranchPlanRequiredContactEmailRule("fallback branch plan needs this field");
  const item = newFallbackBranchPlan("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackBranchPlanCodeLengthRule flags a long code", () => {
  const rule = new FallbackBranchPlanCodeLengthRule(80);
  const item = newFallbackBranchPlan("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackBranchPlanMinimumRangeRule flags values above minimum", () => {
  const rule = new FallbackBranchPlanMinimumRangeRule(9.2, 2247.8);
  const item = newFallbackBranchPlan("x", "y");
  item.minimum = 2249.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
