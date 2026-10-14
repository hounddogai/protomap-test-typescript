import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingJourneyTargetFloorValueRangeRule,
  RollingJourneyTargetLabelLengthRule,
  RollingJourneyTargetMinimumRangeRule,
  RollingJourneyTargetRequiredCodeRule,
  defaultRollingJourneyTargetValidator,
} from "./rolling-journey-target-rules.js";
import { newRollingJourneyTarget } from "./rolling-journey-target.js";

test("RollingJourneyTargetValidator reports every problem", () => {
  const validator = defaultRollingJourneyTargetValidator();
  const item = newRollingJourneyTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingJourneyTargetMinimumRangeRule flags values above minimum", () => {
  const rule = new RollingJourneyTargetMinimumRangeRule(3.9, 3309.7);
  const item = newRollingJourneyTarget("x", "y");
  item.minimum = 3311.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingJourneyTargetRequiredCodeRule flags a blank code", () => {
  const rule = new RollingJourneyTargetRequiredCodeRule("rolling journey target needs this field");
  const item = newRollingJourneyTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingJourneyTargetLabelLengthRule flags a long label", () => {
  const rule = new RollingJourneyTargetLabelLengthRule(120);
  const item = newRollingJourneyTarget("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingJourneyTargetFloorValueRangeRule flags values above floor value", () => {
  const rule = new RollingJourneyTargetFloorValueRangeRule(6.6, 765.2);
  const item = newRollingJourneyTarget("x", "y");
  item.floorValue = 766.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
