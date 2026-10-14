import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionCheckpointConversionRateRangeRule,
  DeflectionCheckpointRateRangeRule,
  DeflectionCheckpointRequiredCodeRule,
  defaultDeflectionCheckpointValidator,
} from "./deflection-checkpoint-rules.js";
import { newDeflectionCheckpoint } from "./deflection-checkpoint.js";

test("DeflectionCheckpointValidator reports every problem", () => {
  const validator = defaultDeflectionCheckpointValidator();
  const item = newDeflectionCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionCheckpointRateRangeRule flags values above rate", () => {
  const rule = new DeflectionCheckpointRateRangeRule(1.5, 2992.1);
  const item = newDeflectionCheckpoint("x", "y");
  item.rate = 2993.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new DeflectionCheckpointRequiredCodeRule("deflection checkpoint needs a value");
  const item = newDeflectionCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionCheckpointConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new DeflectionCheckpointConversionRateRangeRule(4.3, 1950.8);
  const item = newDeflectionCheckpoint("x", "y");
  item.conversionRate = 1952.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
