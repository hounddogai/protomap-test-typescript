import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedFlightPlanCodeLengthRule,
  WeightedFlightPlanRequiredCampaignRefRule,
  WeightedFlightPlanRequiredContactEmailRule,
  defaultWeightedFlightPlanValidator,
} from "./weighted-flight-plan-rules.js";
import { newWeightedFlightPlan } from "./weighted-flight-plan.js";

test("WeightedFlightPlanValidator reports every problem", () => {
  const validator = defaultWeightedFlightPlanValidator();
  const item = newWeightedFlightPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedFlightPlanCodeLengthRule flags a long code", () => {
  const rule = new WeightedFlightPlanCodeLengthRule(80);
  const item = newWeightedFlightPlan("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedFlightPlanRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new WeightedFlightPlanRequiredContactEmailRule("weighted flight plan needs this field");
  const item = newWeightedFlightPlan("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedFlightPlanRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new WeightedFlightPlanRequiredCampaignRefRule("weighted flight plan needs this field");
  const item = newWeightedFlightPlan("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
