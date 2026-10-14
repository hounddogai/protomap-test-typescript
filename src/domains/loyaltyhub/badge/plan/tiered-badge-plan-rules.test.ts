import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredBadgePlanCohortLengthRule,
  TieredBadgePlanCostRangeRule,
  TieredBadgePlanRequiredCohortRule,
  defaultTieredBadgePlanValidator,
} from "./tiered-badge-plan-rules.js";
import { newTieredBadgePlan } from "./tiered-badge-plan.js";

test("TieredBadgePlanValidator reports every problem", () => {
  const validator = defaultTieredBadgePlanValidator();
  const item = newTieredBadgePlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredBadgePlanCohortLengthRule flags a long cohort", () => {
  const rule = new TieredBadgePlanCohortLengthRule(255);
  const item = newTieredBadgePlan("x", "y");
  item.cohort = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBadgePlanCostRangeRule flags values above cost", () => {
  const rule = new TieredBadgePlanCostRangeRule(2.9, 1487.5);
  const item = newTieredBadgePlan("x", "y");
  item.cost = 1489;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBadgePlanRequiredCohortRule flags a blank cohort", () => {
  const rule = new TieredBadgePlanRequiredCohortRule("tiered badge plan needs an entry");
  const item = newTieredBadgePlan("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
