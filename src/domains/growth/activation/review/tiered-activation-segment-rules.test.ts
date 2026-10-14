import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredActivationSegmentCapacityRangeRule,
  TieredActivationSegmentDiscountRangeRule,
  TieredActivationSegmentFloorValueRangeRule,
  TieredActivationSegmentLabelLengthRule,
  TieredActivationSegmentRequiredLabelRule,
  defaultTieredActivationSegmentValidator,
} from "./tiered-activation-segment-rules.js";
import { newTieredActivationSegment } from "./tiered-activation-segment.js";

test("TieredActivationSegmentValidator reports every problem", () => {
  const validator = defaultTieredActivationSegmentValidator();
  const item = newTieredActivationSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredActivationSegmentRequiredLabelRule flags a blank label", () => {
  const rule = new TieredActivationSegmentRequiredLabelRule("tiered activation segment needs this field");
  const item = newTieredActivationSegment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredActivationSegmentFloorValueRangeRule flags values above floor value", () => {
  const rule = new TieredActivationSegmentFloorValueRangeRule(7.7, 2621.1);
  const item = newTieredActivationSegment("x", "y");
  item.floorValue = 2622.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredActivationSegmentCapacityRangeRule flags values above capacity", () => {
  const rule = new TieredActivationSegmentCapacityRangeRule(255, 3600);
  const item = newTieredActivationSegment("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredActivationSegmentDiscountRangeRule flags values above discount", () => {
  const rule = new TieredActivationSegmentDiscountRangeRule(8.7, 3609.8);
  const item = newTieredActivationSegment("x", "y");
  item.discount = 3611.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredActivationSegmentLabelLengthRule flags a long label", () => {
  const rule = new TieredActivationSegmentLabelLengthRule(1000);
  const item = newTieredActivationSegment("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
