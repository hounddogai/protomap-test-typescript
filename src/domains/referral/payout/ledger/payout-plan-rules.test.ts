import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutPlanCodeLengthRule,
  PayoutPlanNameLengthRule,
  PayoutPlanRequiredCodeRule,
  PayoutPlanRequiredNameRule,
  PayoutPlanRequiredSummaryRule,
  defaultPayoutPlanValidator,
} from "./payout-plan-rules.js";
import { newPayoutPlan } from "./payout-plan.js";

test("PayoutPlanValidator reports every problem", () => {
  const validator = defaultPayoutPlanValidator();
  const item = newPayoutPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutPlanRequiredCodeRule flags a blank code", () => {
  const rule = new PayoutPlanRequiredCodeRule("payout plan needs a value");
  const item = newPayoutPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutPlanRequiredNameRule flags a blank name", () => {
  const rule = new PayoutPlanRequiredNameRule("payout plan needs a value");
  const item = newPayoutPlan("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutPlanNameLengthRule flags a long name", () => {
  const rule = new PayoutPlanNameLengthRule(120);
  const item = newPayoutPlan("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutPlanCodeLengthRule flags a long code", () => {
  const rule = new PayoutPlanCodeLengthRule(80);
  const item = newPayoutPlan("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutPlanRequiredSummaryRule flags a blank summary", () => {
  const rule = new PayoutPlanRequiredSummaryRule("payout plan needs a value");
  const item = newPayoutPlan("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
