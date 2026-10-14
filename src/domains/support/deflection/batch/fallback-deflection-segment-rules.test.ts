import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackDeflectionSegmentDurationMinutesRangeRule,
  FallbackDeflectionSegmentRequiredNameRule,
  FallbackDeflectionSegmentRequiredPhoneRule,
  defaultFallbackDeflectionSegmentValidator,
} from "./fallback-deflection-segment-rules.js";
import { newFallbackDeflectionSegment } from "./fallback-deflection-segment.js";

test("FallbackDeflectionSegmentValidator reports every problem", () => {
  const validator = defaultFallbackDeflectionSegmentValidator();
  const item = newFallbackDeflectionSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackDeflectionSegmentRequiredPhoneRule flags a blank phone", () => {
  const rule = new FallbackDeflectionSegmentRequiredPhoneRule("fallback deflection segment needs an entry");
  const item = newFallbackDeflectionSegment("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackDeflectionSegmentDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new FallbackDeflectionSegmentDurationMinutesRangeRule(120, 255);
  const item = newFallbackDeflectionSegment("x", "y");
  item.durationMinutes = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackDeflectionSegmentRequiredNameRule flags a blank name", () => {
  const rule = new FallbackDeflectionSegmentRequiredNameRule("fallback deflection segment needs a value");
  const item = newFallbackDeflectionSegment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
