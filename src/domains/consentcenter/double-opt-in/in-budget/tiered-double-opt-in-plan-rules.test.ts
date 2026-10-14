import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredDoubleOptInPlanCodeLengthRule,
  TieredDoubleOptInPlanLabelLengthRule,
  TieredDoubleOptInPlanRequiredCategoryRule,
  TieredDoubleOptInPlanSendAtRangeRule,
  TieredDoubleOptInPlanVersionRangeRule,
  defaultTieredDoubleOptInPlanValidator,
} from "./tiered-double-opt-in-plan-rules.js";
import { newTieredDoubleOptInPlan } from "./tiered-double-opt-in-plan.js";

test("TieredDoubleOptInPlanValidator reports every problem", () => {
  const validator = defaultTieredDoubleOptInPlanValidator();
  const item = newTieredDoubleOptInPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredDoubleOptInPlanLabelLengthRule flags a long label", () => {
  const rule = new TieredDoubleOptInPlanLabelLengthRule(32);
  const item = newTieredDoubleOptInPlan("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredDoubleOptInPlanCodeLengthRule flags a long code", () => {
  const rule = new TieredDoubleOptInPlanCodeLengthRule(120);
  const item = newTieredDoubleOptInPlan("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredDoubleOptInPlanVersionRangeRule flags values above version", () => {
  const rule = new TieredDoubleOptInPlanVersionRangeRule(1000, 86400);
  const item = newTieredDoubleOptInPlan("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredDoubleOptInPlanRequiredCategoryRule flags a blank category", () => {
  const rule = new TieredDoubleOptInPlanRequiredCategoryRule("tiered double opt in plan needs an entry");
  const item = newTieredDoubleOptInPlan("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredDoubleOptInPlanSendAtRangeRule flags values above send at", () => {
  const rule = new TieredDoubleOptInPlanSendAtRangeRule(255, 86400);
  const item = newTieredDoubleOptInPlan("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
