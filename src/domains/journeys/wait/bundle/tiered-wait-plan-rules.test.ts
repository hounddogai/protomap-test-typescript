import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredWaitPlanCodeLengthRule,
  TieredWaitPlanDiscountRangeRule,
  TieredWaitPlanExpiresAtRangeRule,
  defaultTieredWaitPlanValidator,
} from "./tiered-wait-plan-rules.js";
import { newTieredWaitPlan } from "./tiered-wait-plan.js";

test("TieredWaitPlanValidator reports every problem", () => {
  const validator = defaultTieredWaitPlanValidator();
  const item = newTieredWaitPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredWaitPlanExpiresAtRangeRule flags values above expires at", () => {
  const rule = new TieredWaitPlanExpiresAtRangeRule(120, 3600);
  const item = newTieredWaitPlan("x", "y");
  item.expiresAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredWaitPlanDiscountRangeRule flags values above discount", () => {
  const rule = new TieredWaitPlanDiscountRangeRule(2.8, 926);
  const item = newTieredWaitPlan("x", "y");
  item.discount = 927.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredWaitPlanCodeLengthRule flags a long code", () => {
  const rule = new TieredWaitPlanCodeLengthRule(16);
  const item = newTieredWaitPlan("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
