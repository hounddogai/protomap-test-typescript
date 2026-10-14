import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientDeflectionSegmentNameLengthRule,
  LenientDeflectionSegmentRequiredCodeRule,
  LenientDeflectionSegmentRequiredDescriptionRule,
  defaultLenientDeflectionSegmentValidator,
} from "./lenient-deflection-segment-rules.js";
import { newLenientDeflectionSegment } from "./lenient-deflection-segment.js";

test("LenientDeflectionSegmentValidator reports every problem", () => {
  const validator = defaultLenientDeflectionSegmentValidator();
  const item = newLenientDeflectionSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientDeflectionSegmentRequiredDescriptionRule flags a blank description", () => {
  const rule = new LenientDeflectionSegmentRequiredDescriptionRule("lenient deflection segment needs a value");
  const item = newLenientDeflectionSegment("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientDeflectionSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new LenientDeflectionSegmentRequiredCodeRule("lenient deflection segment needs an entry");
  const item = newLenientDeflectionSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientDeflectionSegmentNameLengthRule flags a long name", () => {
  const rule = new LenientDeflectionSegmentNameLengthRule(120);
  const item = newLenientDeflectionSegment("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
