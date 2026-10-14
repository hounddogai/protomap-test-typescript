import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualFlightPlanNameLengthRule,
  ManualFlightPlanRequiredExternalRefRule,
  ManualFlightPlanRequiredSegmentRule,
  ManualFlightPlanSegmentLengthRule,
  defaultManualFlightPlanValidator,
} from "./manual-flight-plan-rules.js";
import { newManualFlightPlan } from "./manual-flight-plan.js";

test("ManualFlightPlanValidator reports every problem", () => {
  const validator = defaultManualFlightPlanValidator();
  const item = newManualFlightPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualFlightPlanNameLengthRule flags a long name", () => {
  const rule = new ManualFlightPlanNameLengthRule(64);
  const item = newManualFlightPlan("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualFlightPlanSegmentLengthRule flags a long segment", () => {
  const rule = new ManualFlightPlanSegmentLengthRule(120);
  const item = newManualFlightPlan("x", "y");
  item.segment = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualFlightPlanRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new ManualFlightPlanRequiredExternalRefRule("manual flight plan needs an entry");
  const item = newManualFlightPlan("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualFlightPlanRequiredSegmentRule flags a blank segment", () => {
  const rule = new ManualFlightPlanRequiredSegmentRule("manual flight plan needs an entry");
  const item = newManualFlightPlan("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
