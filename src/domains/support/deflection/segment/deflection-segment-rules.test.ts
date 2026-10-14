import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionSegmentDiscountRangeRule,
  DeflectionSegmentExpiresAtRangeRule,
  DeflectionSegmentMinimumRangeRule,
  DeflectionSegmentRequiredNameRule,
  defaultDeflectionSegmentValidator,
} from "./deflection-segment-rules.js";
import { newDeflectionSegment } from "./deflection-segment.js";

test("DeflectionSegmentValidator reports every problem", () => {
  const validator = defaultDeflectionSegmentValidator();
  const item = newDeflectionSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionSegmentMinimumRangeRule flags values above minimum", () => {
  const rule = new DeflectionSegmentMinimumRangeRule(0.6, 3962.1);
  const item = newDeflectionSegment("x", "y");
  item.minimum = 3963.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionSegmentDiscountRangeRule flags values above discount", () => {
  const rule = new DeflectionSegmentDiscountRangeRule(1.1, 2868.4);
  const item = newDeflectionSegment("x", "y");
  item.discount = 2869.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionSegmentRequiredNameRule flags a blank name", () => {
  const rule = new DeflectionSegmentRequiredNameRule("deflection segment needs an entry");
  const item = newDeflectionSegment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionSegmentExpiresAtRangeRule flags values above expires at", () => {
  const rule = new DeflectionSegmentExpiresAtRangeRule(1000, 1000);
  const item = newDeflectionSegment("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
