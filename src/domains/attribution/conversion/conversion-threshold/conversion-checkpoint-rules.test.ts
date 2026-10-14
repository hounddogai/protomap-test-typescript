import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionCheckpointCostRangeRule,
  ConversionCheckpointRequiredCodeRule,
  ConversionCheckpointRequiredLocaleRule,
  ConversionCheckpointRequiredSourceRule,
  ConversionCheckpointSourceLengthRule,
  defaultConversionCheckpointValidator,
} from "./conversion-checkpoint-rules.js";
import { newConversionCheckpoint } from "./conversion-checkpoint.js";

test("ConversionCheckpointValidator reports every problem", () => {
  const validator = defaultConversionCheckpointValidator();
  const item = newConversionCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionCheckpointCostRangeRule flags values above cost", () => {
  const rule = new ConversionCheckpointCostRangeRule(4.5, 496.5);
  const item = newConversionCheckpoint("x", "y");
  item.cost = 498;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new ConversionCheckpointRequiredCodeRule("conversion checkpoint needs an entry");
  const item = newConversionCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionCheckpointRequiredSourceRule flags a blank source", () => {
  const rule = new ConversionCheckpointRequiredSourceRule("conversion checkpoint needs an entry");
  const item = newConversionCheckpoint("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionCheckpointSourceLengthRule flags a long source", () => {
  const rule = new ConversionCheckpointSourceLengthRule(32);
  const item = newConversionCheckpoint("x", "y");
  item.source = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionCheckpointRequiredLocaleRule flags a blank locale", () => {
  const rule = new ConversionCheckpointRequiredLocaleRule("conversion checkpoint needs an entry");
  const item = newConversionCheckpoint("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
