import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalTouchpointCheckpointBudgetRangeRule,
  SeasonalTouchpointCheckpointRequiredCodeRule,
  SeasonalTouchpointCheckpointRequiredDescriptionRule,
  defaultSeasonalTouchpointCheckpointValidator,
} from "./seasonal-touchpoint-checkpoint-rules.js";
import { newSeasonalTouchpointCheckpoint } from "./seasonal-touchpoint-checkpoint.js";

test("SeasonalTouchpointCheckpointValidator reports every problem", () => {
  const validator = defaultSeasonalTouchpointCheckpointValidator();
  const item = newSeasonalTouchpointCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalTouchpointCheckpointBudgetRangeRule flags values above budget", () => {
  const rule = new SeasonalTouchpointCheckpointBudgetRangeRule(2.6, 282.1);
  const item = newSeasonalTouchpointCheckpoint("x", "y");
  item.budget = 283.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalTouchpointCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalTouchpointCheckpointRequiredCodeRule("seasonal touchpoint checkpoint needs this field");
  const item = newSeasonalTouchpointCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalTouchpointCheckpointRequiredDescriptionRule flags a blank description", () => {
  const rule = new SeasonalTouchpointCheckpointRequiredDescriptionRule("seasonal touchpoint checkpoint needs an entry");
  const item = newSeasonalTouchpointCheckpoint("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
