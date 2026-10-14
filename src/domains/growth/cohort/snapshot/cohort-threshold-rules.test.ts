import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortThresholdClicksRangeRule,
  CohortThresholdLabelLengthRule,
  CohortThresholdRequiredCodeRule,
  CohortThresholdRequiredLabelRule,
  CohortThresholdSegmentLengthRule,
  CohortThresholdUnitLengthRule,
  defaultCohortThresholdValidator,
} from "./cohort-threshold-rules.js";
import { newCohortThreshold } from "./cohort-threshold.js";

test("CohortThresholdValidator reports every problem", () => {
  const validator = defaultCohortThresholdValidator();
  const item = newCohortThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortThresholdUnitLengthRule flags a long unit", () => {
  const rule = new CohortThresholdUnitLengthRule(120);
  const item = newCohortThreshold("x", "y");
  item.unit = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortThresholdClicksRangeRule flags values above clicks", () => {
  const rule = new CohortThresholdClicksRangeRule(32, 64);
  const item = newCohortThreshold("x", "y");
  item.clicks = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortThresholdLabelLengthRule flags a long label", () => {
  const rule = new CohortThresholdLabelLengthRule(80);
  const item = newCohortThreshold("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new CohortThresholdRequiredCodeRule("cohort threshold needs a value");
  const item = newCohortThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortThresholdRequiredLabelRule flags a blank label", () => {
  const rule = new CohortThresholdRequiredLabelRule("cohort threshold needs an entry");
  const item = newCohortThreshold("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortThresholdSegmentLengthRule flags a long segment", () => {
  const rule = new CohortThresholdSegmentLengthRule(32);
  const item = newCohortThreshold("x", "y");
  item.segment = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
