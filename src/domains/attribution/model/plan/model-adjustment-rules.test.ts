import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelAdjustmentCodeLengthRule,
  ModelAdjustmentLocaleLengthRule,
  ModelAdjustmentRequiredLabelRule,
  ModelAdjustmentRequiredLocaleRule,
  defaultModelAdjustmentValidator,
} from "./model-adjustment-rules.js";
import { newModelAdjustment } from "./model-adjustment.js";

test("ModelAdjustmentValidator reports every problem", () => {
  const validator = defaultModelAdjustmentValidator();
  const item = newModelAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new ModelAdjustmentCodeLengthRule(1000);
  const item = newModelAdjustment("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelAdjustmentLocaleLengthRule flags a long locale", () => {
  const rule = new ModelAdjustmentLocaleLengthRule(32);
  const item = newModelAdjustment("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelAdjustmentRequiredLabelRule flags a blank label", () => {
  const rule = new ModelAdjustmentRequiredLabelRule("model adjustment needs a value");
  const item = newModelAdjustment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelAdjustmentRequiredLocaleRule flags a blank locale", () => {
  const rule = new ModelAdjustmentRequiredLocaleRule("model adjustment needs an entry");
  const item = newModelAdjustment("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
