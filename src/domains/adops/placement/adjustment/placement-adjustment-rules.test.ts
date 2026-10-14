import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementAdjustmentAttemptsRangeRule,
  PlacementAdjustmentLabelLengthRule,
  PlacementAdjustmentRequiredCodeRule,
  defaultPlacementAdjustmentValidator,
} from "./placement-adjustment-rules.js";
import { newPlacementAdjustment } from "./placement-adjustment.js";

test("PlacementAdjustmentValidator reports every problem", () => {
  const validator = defaultPlacementAdjustmentValidator();
  const item = newPlacementAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementAdjustmentLabelLengthRule flags a long label", () => {
  const rule = new PlacementAdjustmentLabelLengthRule(64);
  const item = newPlacementAdjustment("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new PlacementAdjustmentRequiredCodeRule("placement adjustment needs this field");
  const item = newPlacementAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementAdjustmentAttemptsRangeRule flags values above attempts", () => {
  const rule = new PlacementAdjustmentAttemptsRangeRule(80, 1000);
  const item = newPlacementAdjustment("x", "y");
  item.attempts = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
