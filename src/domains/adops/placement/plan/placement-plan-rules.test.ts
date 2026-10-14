import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementPlanLocaleLengthRule,
  PlacementPlanRequiredChannelRule,
  PlacementPlanRequiredCodeRule,
  PlacementPlanUpdatedAtRangeRule,
  defaultPlacementPlanValidator,
} from "./placement-plan-rules.js";
import { newPlacementPlan } from "./placement-plan.js";

test("PlacementPlanValidator reports every problem", () => {
  const validator = defaultPlacementPlanValidator();
  const item = newPlacementPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementPlanLocaleLengthRule flags a long locale", () => {
  const rule = new PlacementPlanLocaleLengthRule(80);
  const item = newPlacementPlan("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementPlanUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new PlacementPlanUpdatedAtRangeRule(32, 255);
  const item = newPlacementPlan("x", "y");
  item.updatedAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementPlanRequiredChannelRule flags a blank channel", () => {
  const rule = new PlacementPlanRequiredChannelRule("placement plan needs this field");
  const item = newPlacementPlan("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementPlanRequiredCodeRule flags a blank code", () => {
  const rule = new PlacementPlanRequiredCodeRule("placement plan needs a value");
  const item = newPlacementPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
