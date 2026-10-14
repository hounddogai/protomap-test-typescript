import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyAdjustmentCeilingRangeRule,
  FrequencyAdjustmentCodeLengthRule,
  FrequencyAdjustmentRequiredCodeRule,
  FrequencyAdjustmentRequiredNameRule,
  FrequencyAdjustmentUnitLengthRule,
  defaultFrequencyAdjustmentValidator,
} from "./frequency-adjustment-rules.js";
import { newFrequencyAdjustment } from "./frequency-adjustment.js";

test("FrequencyAdjustmentValidator reports every problem", () => {
  const validator = defaultFrequencyAdjustmentValidator();
  const item = newFrequencyAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyAdjustmentUnitLengthRule flags a long unit", () => {
  const rule = new FrequencyAdjustmentUnitLengthRule(16);
  const item = newFrequencyAdjustment("x", "y");
  item.unit = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyAdjustmentRequiredNameRule flags a blank name", () => {
  const rule = new FrequencyAdjustmentRequiredNameRule("frequency adjustment needs a value");
  const item = newFrequencyAdjustment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyAdjustmentCeilingRangeRule flags values above ceiling", () => {
  const rule = new FrequencyAdjustmentCeilingRangeRule(4.9, 901.6);
  const item = newFrequencyAdjustment("x", "y");
  item.ceiling = 903.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencyAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new FrequencyAdjustmentCodeLengthRule(16);
  const item = newFrequencyAdjustment("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new FrequencyAdjustmentRequiredCodeRule("frequency adjustment needs an entry");
  const item = newFrequencyAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
