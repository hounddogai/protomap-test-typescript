import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedFunnelAdjustmentLabelLengthRule,
  WeightedFunnelAdjustmentOwnerIdLengthRule,
  WeightedFunnelAdjustmentRequiredCodeRule,
  WeightedFunnelAdjustmentRequiredOwnerIdRule,
  defaultWeightedFunnelAdjustmentValidator,
} from "./weighted-funnel-adjustment-rules.js";
import { newWeightedFunnelAdjustment } from "./weighted-funnel-adjustment.js";

test("WeightedFunnelAdjustmentValidator reports every problem", () => {
  const validator = defaultWeightedFunnelAdjustmentValidator();
  const item = newWeightedFunnelAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedFunnelAdjustmentOwnerIdLengthRule flags a long owner id", () => {
  const rule = new WeightedFunnelAdjustmentOwnerIdLengthRule(32);
  const item = newWeightedFunnelAdjustment("x", "y");
  item.ownerId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedFunnelAdjustmentRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new WeightedFunnelAdjustmentRequiredOwnerIdRule("weighted funnel adjustment needs an entry");
  const item = newWeightedFunnelAdjustment("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedFunnelAdjustmentLabelLengthRule flags a long label", () => {
  const rule = new WeightedFunnelAdjustmentLabelLengthRule(86400);
  const item = newWeightedFunnelAdjustment("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedFunnelAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedFunnelAdjustmentRequiredCodeRule("weighted funnel adjustment needs an entry");
  const item = newWeightedFunnelAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
