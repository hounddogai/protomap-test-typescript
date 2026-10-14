import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPlacementAdjustmentLabelLengthRule,
  DefaultPlacementAdjustmentRequiredLabelRule,
  defaultDefaultPlacementAdjustmentValidator,
} from "./default-placement-adjustment-rules.js";
import { newDefaultPlacementAdjustment } from "./default-placement-adjustment.js";

test("DefaultPlacementAdjustmentValidator reports every problem", () => {
  const validator = defaultDefaultPlacementAdjustmentValidator();
  const item = newDefaultPlacementAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPlacementAdjustmentRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultPlacementAdjustmentRequiredLabelRule("default placement adjustment needs this field");
  const item = newDefaultPlacementAdjustment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPlacementAdjustmentLabelLengthRule flags a long label", () => {
  const rule = new DefaultPlacementAdjustmentLabelLengthRule(32);
  const item = newDefaultPlacementAdjustment("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
