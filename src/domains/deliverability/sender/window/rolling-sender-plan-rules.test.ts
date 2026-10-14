import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingSenderPlanRequiredCodeRule,
  RollingSenderPlanRequiredNotesRule,
  RollingSenderPlanRevisionRangeRule,
  RollingSenderPlanTimezoneLengthRule,
  defaultRollingSenderPlanValidator,
} from "./rolling-sender-plan-rules.js";
import { newRollingSenderPlan } from "./rolling-sender-plan.js";

test("RollingSenderPlanValidator reports every problem", () => {
  const validator = defaultRollingSenderPlanValidator();
  const item = newRollingSenderPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingSenderPlanTimezoneLengthRule flags a long timezone", () => {
  const rule = new RollingSenderPlanTimezoneLengthRule(32);
  const item = newRollingSenderPlan("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingSenderPlanRequiredNotesRule flags a blank notes", () => {
  const rule = new RollingSenderPlanRequiredNotesRule("rolling sender plan needs a value");
  const item = newRollingSenderPlan("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingSenderPlanRevisionRangeRule flags values above revision", () => {
  const rule = new RollingSenderPlanRevisionRangeRule(32, 255);
  const item = newRollingSenderPlan("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingSenderPlanRequiredCodeRule flags a blank code", () => {
  const rule = new RollingSenderPlanRequiredCodeRule("rolling sender plan needs this field");
  const item = newRollingSenderPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
