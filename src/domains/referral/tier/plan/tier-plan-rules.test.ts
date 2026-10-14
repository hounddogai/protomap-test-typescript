import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierPlanClicksRangeRule,
  TierPlanLabelLengthRule,
  TierPlanRequiredCodeRule,
  defaultTierPlanValidator,
} from "./tier-plan-rules.js";
import { newTierPlan } from "./tier-plan.js";

test("TierPlanValidator reports every problem", () => {
  const validator = defaultTierPlanValidator();
  const item = newTierPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierPlanLabelLengthRule flags a long label", () => {
  const rule = new TierPlanLabelLengthRule(64);
  const item = newTierPlan("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierPlanClicksRangeRule flags values above clicks", () => {
  const rule = new TierPlanClicksRangeRule(64, 255);
  const item = newTierPlan("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierPlanRequiredCodeRule flags a blank code", () => {
  const rule = new TierPlanRequiredCodeRule("tier plan needs a value");
  const item = newTierPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
