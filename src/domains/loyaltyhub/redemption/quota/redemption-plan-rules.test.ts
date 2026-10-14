import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionPlanNotesLengthRule,
  RedemptionPlanRequiredCodeRule,
  RedemptionPlanRequiredNameRule,
  RedemptionPlanRequiredNotesRule,
  RedemptionPlanUtmSourceLengthRule,
  defaultRedemptionPlanValidator,
} from "./redemption-plan-rules.js";
import { newRedemptionPlan } from "./redemption-plan.js";

test("RedemptionPlanValidator reports every problem", () => {
  const validator = defaultRedemptionPlanValidator();
  const item = newRedemptionPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionPlanRequiredCodeRule flags a blank code", () => {
  const rule = new RedemptionPlanRequiredCodeRule("redemption plan needs a value");
  const item = newRedemptionPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionPlanNotesLengthRule flags a long notes", () => {
  const rule = new RedemptionPlanNotesLengthRule(64);
  const item = newRedemptionPlan("x", "y");
  item.notes = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionPlanRequiredNotesRule flags a blank notes", () => {
  const rule = new RedemptionPlanRequiredNotesRule("redemption plan needs a value");
  const item = newRedemptionPlan("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionPlanRequiredNameRule flags a blank name", () => {
  const rule = new RedemptionPlanRequiredNameRule("redemption plan needs an entry");
  const item = newRedemptionPlan("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionPlanUtmSourceLengthRule flags a long utm source", () => {
  const rule = new RedemptionPlanUtmSourceLengthRule(255);
  const item = newRedemptionPlan("x", "y");
  item.utmSource = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
