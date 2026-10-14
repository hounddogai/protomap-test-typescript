import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedTouchpointAssignmentQuantityRangeRule,
  WeightedTouchpointAssignmentRequiredContactEmailRule,
  WeightedTouchpointAssignmentRequiredLabelRule,
  WeightedTouchpointAssignmentRequiredSegmentRule,
  WeightedTouchpointAssignmentSegmentLengthRule,
  defaultWeightedTouchpointAssignmentValidator,
} from "./weighted-touchpoint-assignment-rules.js";
import { newWeightedTouchpointAssignment } from "./weighted-touchpoint-assignment.js";

test("WeightedTouchpointAssignmentValidator reports every problem", () => {
  const validator = defaultWeightedTouchpointAssignmentValidator();
  const item = newWeightedTouchpointAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedTouchpointAssignmentRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new WeightedTouchpointAssignmentRequiredContactEmailRule("weighted touchpoint assignment needs an entry");
  const item = newWeightedTouchpointAssignment("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedTouchpointAssignmentQuantityRangeRule flags values above quantity", () => {
  const rule = new WeightedTouchpointAssignmentQuantityRangeRule(16, 255);
  const item = newWeightedTouchpointAssignment("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedTouchpointAssignmentRequiredSegmentRule flags a blank segment", () => {
  const rule = new WeightedTouchpointAssignmentRequiredSegmentRule("weighted touchpoint assignment needs a value");
  const item = newWeightedTouchpointAssignment("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedTouchpointAssignmentSegmentLengthRule flags a long segment", () => {
  const rule = new WeightedTouchpointAssignmentSegmentLengthRule(80);
  const item = newWeightedTouchpointAssignment("x", "y");
  item.segment = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedTouchpointAssignmentRequiredLabelRule flags a blank label", () => {
  const rule = new WeightedTouchpointAssignmentRequiredLabelRule("weighted touchpoint assignment needs a value");
  const item = newWeightedTouchpointAssignment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
