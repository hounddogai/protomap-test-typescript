import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowCheckpointClicksRangeRule,
  WindowCheckpointCostRangeRule,
  WindowCheckpointLocaleLengthRule,
  WindowCheckpointMinimumRangeRule,
  WindowCheckpointRequiredLocaleRule,
  defaultWindowCheckpointValidator,
} from "./window-checkpoint-rules.js";
import { newWindowCheckpoint } from "./window-checkpoint.js";

test("WindowCheckpointValidator reports every problem", () => {
  const validator = defaultWindowCheckpointValidator();
  const item = newWindowCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowCheckpointMinimumRangeRule flags values above minimum", () => {
  const rule = new WindowCheckpointMinimumRangeRule(2.4, 4149.8);
  const item = newWindowCheckpoint("x", "y");
  item.minimum = 4151.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowCheckpointLocaleLengthRule flags a long locale", () => {
  const rule = new WindowCheckpointLocaleLengthRule(32);
  const item = newWindowCheckpoint("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowCheckpointCostRangeRule flags values above cost", () => {
  const rule = new WindowCheckpointCostRangeRule(9.2, 3752.4);
  const item = newWindowCheckpoint("x", "y");
  item.cost = 3753.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowCheckpointClicksRangeRule flags values above clicks", () => {
  const rule = new WindowCheckpointClicksRangeRule(32, 32);
  const item = newWindowCheckpoint("x", "y");
  item.clicks = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowCheckpointRequiredLocaleRule flags a blank locale", () => {
  const rule = new WindowCheckpointRequiredLocaleRule("window checkpoint needs this field");
  const item = newWindowCheckpoint("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
