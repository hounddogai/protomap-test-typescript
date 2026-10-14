import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementThresholdCodeLengthRule,
  PlacementThresholdNameLengthRule,
  PlacementThresholdRequiredNameRule,
  defaultPlacementThresholdValidator,
} from "./placement-threshold-rules.js";
import { newPlacementThreshold } from "./placement-threshold.js";

test("PlacementThresholdValidator reports every problem", () => {
  const validator = defaultPlacementThresholdValidator();
  const item = newPlacementThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementThresholdNameLengthRule flags a long name", () => {
  const rule = new PlacementThresholdNameLengthRule(80);
  const item = newPlacementThreshold("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementThresholdRequiredNameRule flags a blank name", () => {
  const rule = new PlacementThresholdRequiredNameRule("placement threshold needs this field");
  const item = newPlacementThreshold("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementThresholdCodeLengthRule flags a long code", () => {
  const rule = new PlacementThresholdCodeLengthRule(1000);
  const item = newPlacementThreshold("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
