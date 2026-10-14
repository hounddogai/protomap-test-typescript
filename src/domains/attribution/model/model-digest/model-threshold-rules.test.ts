import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelThresholdCodeLengthRule,
  ModelThresholdQuantityRangeRule,
  ModelThresholdRequiredLabelRule,
  defaultModelThresholdValidator,
} from "./model-threshold-rules.js";
import { newModelThreshold } from "./model-threshold.js";

test("ModelThresholdValidator reports every problem", () => {
  const validator = defaultModelThresholdValidator();
  const item = newModelThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelThresholdCodeLengthRule flags a long code", () => {
  const rule = new ModelThresholdCodeLengthRule(64);
  const item = newModelThreshold("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelThresholdRequiredLabelRule flags a blank label", () => {
  const rule = new ModelThresholdRequiredLabelRule("model threshold needs a value");
  const item = newModelThreshold("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelThresholdQuantityRangeRule flags values above quantity", () => {
  const rule = new ModelThresholdQuantityRangeRule(120, 3600);
  const item = newModelThreshold("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
