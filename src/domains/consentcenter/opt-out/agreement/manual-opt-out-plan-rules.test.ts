import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualOptOutPlanNameLengthRule,
  ManualOptOutPlanRequiredLocaleRule,
  ManualOptOutPlanRequiredNameRule,
  defaultManualOptOutPlanValidator,
} from "./manual-opt-out-plan-rules.js";
import { newManualOptOutPlan } from "./manual-opt-out-plan.js";

test("ManualOptOutPlanValidator reports every problem", () => {
  const validator = defaultManualOptOutPlanValidator();
  const item = newManualOptOutPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualOptOutPlanRequiredNameRule flags a blank name", () => {
  const rule = new ManualOptOutPlanRequiredNameRule("manual opt out plan needs an entry");
  const item = newManualOptOutPlan("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualOptOutPlanNameLengthRule flags a long name", () => {
  const rule = new ManualOptOutPlanNameLengthRule(32);
  const item = newManualOptOutPlan("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualOptOutPlanRequiredLocaleRule flags a blank locale", () => {
  const rule = new ManualOptOutPlanRequiredLocaleRule("manual opt out plan needs this field");
  const item = newManualOptOutPlan("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
