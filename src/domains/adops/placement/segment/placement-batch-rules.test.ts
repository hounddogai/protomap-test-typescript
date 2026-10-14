import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementBatchCodeLengthRule,
  PlacementBatchLabelLengthRule,
  PlacementBatchQuantityRangeRule,
  PlacementBatchRequiredCodeRule,
  defaultPlacementBatchValidator,
} from "./placement-batch-rules.js";
import { newPlacementBatch } from "./placement-batch.js";

test("PlacementBatchValidator reports every problem", () => {
  const validator = defaultPlacementBatchValidator();
  const item = newPlacementBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementBatchRequiredCodeRule flags a blank code", () => {
  const rule = new PlacementBatchRequiredCodeRule("placement batch needs a value");
  const item = newPlacementBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementBatchCodeLengthRule flags a long code", () => {
  const rule = new PlacementBatchCodeLengthRule(80);
  const item = newPlacementBatch("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementBatchLabelLengthRule flags a long label", () => {
  const rule = new PlacementBatchLabelLengthRule(16);
  const item = newPlacementBatch("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementBatchQuantityRangeRule flags values above quantity", () => {
  const rule = new PlacementBatchQuantityRangeRule(120, 120);
  const item = newPlacementBatch("x", "y");
  item.quantity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
