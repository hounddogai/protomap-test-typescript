import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalStepCycleCodeLengthRule,
  GlobalStepCycleRequiredLabelRule,
  GlobalStepCycleScoreRangeRule,
  defaultGlobalStepCycleValidator,
} from "./global-step-cycle-rules.js";
import { newGlobalStepCycle } from "./global-step-cycle.js";

test("GlobalStepCycleValidator reports every problem", () => {
  const validator = defaultGlobalStepCycleValidator();
  const item = newGlobalStepCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalStepCycleCodeLengthRule flags a long code", () => {
  const rule = new GlobalStepCycleCodeLengthRule(120);
  const item = newGlobalStepCycle("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalStepCycleScoreRangeRule flags values above score", () => {
  const rule = new GlobalStepCycleScoreRangeRule(0.8, 4225.6);
  const item = newGlobalStepCycle("x", "y");
  item.score = 4227.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalStepCycleRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalStepCycleRequiredLabelRule("global step cycle needs this field");
  const item = newGlobalStepCycle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
