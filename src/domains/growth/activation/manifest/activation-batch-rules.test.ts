import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationBatchDiscountRangeRule,
  ActivationBatchRequiredUnitRule,
  ActivationBatchUnitLengthRule,
  ActivationBatchVersionRangeRule,
  defaultActivationBatchValidator,
} from "./activation-batch-rules.js";
import { newActivationBatch } from "./activation-batch.js";

test("ActivationBatchValidator reports every problem", () => {
  const validator = defaultActivationBatchValidator();
  const item = newActivationBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationBatchVersionRangeRule flags values above version", () => {
  const rule = new ActivationBatchVersionRangeRule(16, 120);
  const item = newActivationBatch("x", "y");
  item.version = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationBatchDiscountRangeRule flags values above discount", () => {
  const rule = new ActivationBatchDiscountRangeRule(2.4, 2703);
  const item = newActivationBatch("x", "y");
  item.discount = 2704.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationBatchUnitLengthRule flags a long unit", () => {
  const rule = new ActivationBatchUnitLengthRule(120);
  const item = newActivationBatch("x", "y");
  item.unit = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationBatchRequiredUnitRule flags a blank unit", () => {
  const rule = new ActivationBatchRequiredUnitRule("activation batch needs a value");
  const item = newActivationBatch("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
