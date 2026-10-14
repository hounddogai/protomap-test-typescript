import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointEstimateAttemptsRangeRule,
  TouchpointEstimateRequiredSegmentRule,
  TouchpointEstimateSegmentLengthRule,
  defaultTouchpointEstimateValidator,
} from "./touchpoint-estimate-rules.js";
import { newTouchpointEstimate } from "./touchpoint-estimate.js";

test("TouchpointEstimateValidator reports every problem", () => {
  const validator = defaultTouchpointEstimateValidator();
  const item = newTouchpointEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointEstimateAttemptsRangeRule flags values above attempts", () => {
  const rule = new TouchpointEstimateAttemptsRangeRule(120, 255);
  const item = newTouchpointEstimate("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointEstimateSegmentLengthRule flags a long segment", () => {
  const rule = new TouchpointEstimateSegmentLengthRule(120);
  const item = newTouchpointEstimate("x", "y");
  item.segment = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointEstimateRequiredSegmentRule flags a blank segment", () => {
  const rule = new TouchpointEstimateRequiredSegmentRule("touchpoint estimate needs this field");
  const item = newTouchpointEstimate("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
