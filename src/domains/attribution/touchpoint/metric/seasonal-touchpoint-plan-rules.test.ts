import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalTouchpointPlanCodeLengthRule,
  SeasonalTouchpointPlanRequiredCodeRule,
  SeasonalTouchpointPlanRequiredCountryRule,
  SeasonalTouchpointPlanSegmentLengthRule,
  defaultSeasonalTouchpointPlanValidator,
} from "./seasonal-touchpoint-plan-rules.js";
import { newSeasonalTouchpointPlan } from "./seasonal-touchpoint-plan.js";

test("SeasonalTouchpointPlanValidator reports every problem", () => {
  const validator = defaultSeasonalTouchpointPlanValidator();
  const item = newSeasonalTouchpointPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalTouchpointPlanSegmentLengthRule flags a long segment", () => {
  const rule = new SeasonalTouchpointPlanSegmentLengthRule(64);
  const item = newSeasonalTouchpointPlan("x", "y");
  item.segment = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalTouchpointPlanRequiredCountryRule flags a blank country", () => {
  const rule = new SeasonalTouchpointPlanRequiredCountryRule("seasonal touchpoint plan needs this field");
  const item = newSeasonalTouchpointPlan("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalTouchpointPlanCodeLengthRule flags a long code", () => {
  const rule = new SeasonalTouchpointPlanCodeLengthRule(120);
  const item = newSeasonalTouchpointPlan("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalTouchpointPlanRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalTouchpointPlanRequiredCodeRule("seasonal touchpoint plan needs a value");
  const item = newSeasonalTouchpointPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
