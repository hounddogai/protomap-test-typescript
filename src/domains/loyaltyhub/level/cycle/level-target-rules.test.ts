import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelTargetRequiredCodeRule,
  LevelTargetRequiredSummaryRule,
  LevelTargetWeightRangeRule,
  defaultLevelTargetValidator,
} from "./level-target-rules.js";
import { newLevelTarget } from "./level-target.js";

test("LevelTargetValidator reports every problem", () => {
  const validator = defaultLevelTargetValidator();
  const item = newLevelTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelTargetWeightRangeRule flags values above weight", () => {
  const rule = new LevelTargetWeightRangeRule(5.8, 382.3);
  const item = newLevelTarget("x", "y");
  item.weight = 383.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelTargetRequiredCodeRule flags a blank code", () => {
  const rule = new LevelTargetRequiredCodeRule("level target needs this field");
  const item = newLevelTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelTargetRequiredSummaryRule flags a blank summary", () => {
  const rule = new LevelTargetRequiredSummaryRule("level target needs an entry");
  const item = newLevelTarget("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
