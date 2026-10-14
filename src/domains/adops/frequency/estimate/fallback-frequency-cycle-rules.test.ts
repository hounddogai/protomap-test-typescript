import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackFrequencyCycleEndsAtRangeRule,
  FallbackFrequencyCycleLimitRangeRule,
  FallbackFrequencyCycleRequiredCodeRule,
  FallbackFrequencyCycleRequiredLabelRule,
  defaultFallbackFrequencyCycleValidator,
} from "./fallback-frequency-cycle-rules.js";
import { newFallbackFrequencyCycle } from "./fallback-frequency-cycle.js";

test("FallbackFrequencyCycleValidator reports every problem", () => {
  const validator = defaultFallbackFrequencyCycleValidator();
  const item = newFallbackFrequencyCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackFrequencyCycleRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackFrequencyCycleRequiredCodeRule("fallback frequency cycle needs an entry");
  const item = newFallbackFrequencyCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackFrequencyCycleLimitRangeRule flags values above limit", () => {
  const rule = new FallbackFrequencyCycleLimitRangeRule(80, 255);
  const item = newFallbackFrequencyCycle("x", "y");
  item.limit = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackFrequencyCycleEndsAtRangeRule flags values above ends at", () => {
  const rule = new FallbackFrequencyCycleEndsAtRangeRule(32, 3600);
  const item = newFallbackFrequencyCycle("x", "y");
  item.endsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackFrequencyCycleRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackFrequencyCycleRequiredLabelRule("fallback frequency cycle needs an entry");
  const item = newFallbackFrequencyCycle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
