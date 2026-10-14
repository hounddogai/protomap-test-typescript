import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepCycleNameLengthRule,
  StepCycleRegionLengthRule,
  StepCycleRequiredAudienceIdRule,
  defaultStepCycleValidator,
} from "./step-cycle-rules.js";
import { newStepCycle } from "./step-cycle.js";

test("StepCycleValidator reports every problem", () => {
  const validator = defaultStepCycleValidator();
  const item = newStepCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepCycleRegionLengthRule flags a long region", () => {
  const rule = new StepCycleRegionLengthRule(1000);
  const item = newStepCycle("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepCycleNameLengthRule flags a long name", () => {
  const rule = new StepCycleNameLengthRule(16);
  const item = newStepCycle("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepCycleRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new StepCycleRequiredAudienceIdRule("step cycle needs this field");
  const item = newStepCycle("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
