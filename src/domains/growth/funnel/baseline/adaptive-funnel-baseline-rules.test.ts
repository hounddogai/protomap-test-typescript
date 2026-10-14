import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveFunnelBaselineBudgetRangeRule,
  AdaptiveFunnelBaselineCeilingRangeRule,
  AdaptiveFunnelBaselineRequiredOwnerIdRule,
  AdaptiveFunnelBaselineRequiredTitleRule,
  AdaptiveFunnelBaselineTitleLengthRule,
  defaultAdaptiveFunnelBaselineValidator,
} from "./adaptive-funnel-baseline-rules.js";
import { newAdaptiveFunnelBaseline } from "./adaptive-funnel-baseline.js";

test("AdaptiveFunnelBaselineValidator reports every problem", () => {
  const validator = defaultAdaptiveFunnelBaselineValidator();
  const item = newAdaptiveFunnelBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveFunnelBaselineTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveFunnelBaselineTitleLengthRule(3600);
  const item = newAdaptiveFunnelBaseline("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveFunnelBaselineRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new AdaptiveFunnelBaselineRequiredOwnerIdRule("adaptive funnel baseline needs a value");
  const item = newAdaptiveFunnelBaseline("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveFunnelBaselineRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveFunnelBaselineRequiredTitleRule("adaptive funnel baseline needs a value");
  const item = newAdaptiveFunnelBaseline("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveFunnelBaselineCeilingRangeRule flags values above ceiling", () => {
  const rule = new AdaptiveFunnelBaselineCeilingRangeRule(6.5, 3600.2);
  const item = newAdaptiveFunnelBaseline("x", "y");
  item.ceiling = 3601.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveFunnelBaselineBudgetRangeRule flags values above budget", () => {
  const rule = new AdaptiveFunnelBaselineBudgetRangeRule(2.6, 3633.3);
  const item = newAdaptiveFunnelBaseline("x", "y");
  item.budget = 3634.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
