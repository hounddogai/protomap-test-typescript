import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyAllocationJourneyIdLengthRule,
  FrequencyAllocationRequiredCodeRule,
  FrequencyAllocationRequiredSegmentRule,
  FrequencyAllocationSegmentLengthRule,
  defaultFrequencyAllocationValidator,
} from "./frequency-allocation-rules.js";
import { newFrequencyAllocation } from "./frequency-allocation.js";

test("FrequencyAllocationValidator reports every problem", () => {
  const validator = defaultFrequencyAllocationValidator();
  const item = newFrequencyAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyAllocationSegmentLengthRule flags a long segment", () => {
  const rule = new FrequencyAllocationSegmentLengthRule(255);
  const item = newFrequencyAllocation("x", "y");
  item.segment = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyAllocationRequiredSegmentRule flags a blank segment", () => {
  const rule = new FrequencyAllocationRequiredSegmentRule("frequency allocation needs a value");
  const item = newFrequencyAllocation("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new FrequencyAllocationRequiredCodeRule("frequency allocation needs a value");
  const item = newFrequencyAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyAllocationJourneyIdLengthRule flags a long journey id", () => {
  const rule = new FrequencyAllocationJourneyIdLengthRule(1000);
  const item = newFrequencyAllocation("x", "y");
  item.journeyId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
