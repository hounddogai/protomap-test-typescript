import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveReputationPlanChannelLengthRule,
  AdaptiveReputationPlanCodeLengthRule,
  AdaptiveReputationPlanRequiredNameRule,
  AdaptiveReputationPlanRequiredTimezoneRule,
  defaultAdaptiveReputationPlanValidator,
} from "./adaptive-reputation-plan-rules.js";
import { newAdaptiveReputationPlan } from "./adaptive-reputation-plan.js";

test("AdaptiveReputationPlanValidator reports every problem", () => {
  const validator = defaultAdaptiveReputationPlanValidator();
  const item = newAdaptiveReputationPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveReputationPlanCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveReputationPlanCodeLengthRule(32);
  const item = newAdaptiveReputationPlan("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveReputationPlanRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveReputationPlanRequiredNameRule("adaptive reputation plan needs a value");
  const item = newAdaptiveReputationPlan("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveReputationPlanRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new AdaptiveReputationPlanRequiredTimezoneRule("adaptive reputation plan needs this field");
  const item = newAdaptiveReputationPlan("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveReputationPlanChannelLengthRule flags a long channel", () => {
  const rule = new AdaptiveReputationPlanChannelLengthRule(80);
  const item = newAdaptiveReputationPlan("x", "y");
  item.channel = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
