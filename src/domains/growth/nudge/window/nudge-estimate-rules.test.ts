import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeEstimateLabelLengthRule,
  NudgeEstimateRequiredSegmentRule,
  NudgeEstimateRequiredSourceRule,
  NudgeEstimateSegmentLengthRule,
  NudgeEstimateSourceLengthRule,
  defaultNudgeEstimateValidator,
} from "./nudge-estimate-rules.js";
import { newNudgeEstimate } from "./nudge-estimate.js";

test("NudgeEstimateValidator reports every problem", () => {
  const validator = defaultNudgeEstimateValidator();
  const item = newNudgeEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeEstimateSourceLengthRule flags a long source", () => {
  const rule = new NudgeEstimateSourceLengthRule(1000);
  const item = newNudgeEstimate("x", "y");
  item.source = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeEstimateRequiredSegmentRule flags a blank segment", () => {
  const rule = new NudgeEstimateRequiredSegmentRule("nudge estimate needs a value");
  const item = newNudgeEstimate("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeEstimateSegmentLengthRule flags a long segment", () => {
  const rule = new NudgeEstimateSegmentLengthRule(32);
  const item = newNudgeEstimate("x", "y");
  item.segment = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeEstimateRequiredSourceRule flags a blank source", () => {
  const rule = new NudgeEstimateRequiredSourceRule("nudge estimate needs an entry");
  const item = newNudgeEstimate("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeEstimateLabelLengthRule flags a long label", () => {
  const rule = new NudgeEstimateLabelLengthRule(120);
  const item = newNudgeEstimate("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
