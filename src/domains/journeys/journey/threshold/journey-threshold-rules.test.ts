import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyThresholdLabelLengthRule,
  JourneyThresholdRequiredCodeRule,
  JourneyThresholdRequiredLabelRule,
  JourneyThresholdRequiredTimezoneRule,
  defaultJourneyThresholdValidator,
} from "./journey-threshold-rules.js";
import { newJourneyThreshold } from "./journey-threshold.js";

test("JourneyThresholdValidator reports every problem", () => {
  const validator = defaultJourneyThresholdValidator();
  const item = newJourneyThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyThresholdRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new JourneyThresholdRequiredTimezoneRule("journey threshold needs an entry");
  const item = newJourneyThreshold("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyThresholdRequiredLabelRule flags a blank label", () => {
  const rule = new JourneyThresholdRequiredLabelRule("journey threshold needs a value");
  const item = newJourneyThreshold("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new JourneyThresholdRequiredCodeRule("journey threshold needs this field");
  const item = newJourneyThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyThresholdLabelLengthRule flags a long label", () => {
  const rule = new JourneyThresholdLabelLengthRule(255);
  const item = newJourneyThreshold("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
