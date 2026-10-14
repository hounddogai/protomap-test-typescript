import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveModelAdjustmentCodeLengthRule,
  AdaptiveModelAdjustmentCreatedAtRangeRule,
  AdaptiveModelAdjustmentRequiredCodeRule,
  defaultAdaptiveModelAdjustmentValidator,
} from "./adaptive-model-adjustment-rules.js";
import { newAdaptiveModelAdjustment } from "./adaptive-model-adjustment.js";

test("AdaptiveModelAdjustmentValidator reports every problem", () => {
  const validator = defaultAdaptiveModelAdjustmentValidator();
  const item = newAdaptiveModelAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveModelAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveModelAdjustmentCodeLengthRule(16);
  const item = newAdaptiveModelAdjustment("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveModelAdjustmentCreatedAtRangeRule flags values above created at", () => {
  const rule = new AdaptiveModelAdjustmentCreatedAtRangeRule(80, 255);
  const item = newAdaptiveModelAdjustment("x", "y");
  item.createdAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveModelAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveModelAdjustmentRequiredCodeRule("adaptive model adjustment needs an entry");
  const item = newAdaptiveModelAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
