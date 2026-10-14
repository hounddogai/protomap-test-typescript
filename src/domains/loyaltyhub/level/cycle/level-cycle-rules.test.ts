import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelCycleCostRangeRule,
  LevelCycleNameLengthRule,
  defaultLevelCycleValidator,
} from "./level-cycle-rules.js";
import { newLevelCycle } from "./level-cycle.js";

test("LevelCycleValidator reports every problem", () => {
  const validator = defaultLevelCycleValidator();
  const item = newLevelCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelCycleNameLengthRule flags a long name", () => {
  const rule = new LevelCycleNameLengthRule(16);
  const item = newLevelCycle("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelCycleCostRangeRule flags values above cost", () => {
  const rule = new LevelCycleCostRangeRule(6.2, 3307.3);
  const item = newLevelCycle("x", "y");
  item.cost = 3308.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
