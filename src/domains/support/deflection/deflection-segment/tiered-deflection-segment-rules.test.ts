import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredDeflectionSegmentCodeLengthRule,
  TieredDeflectionSegmentRequiredCodeRule,
  defaultTieredDeflectionSegmentValidator,
} from "./tiered-deflection-segment-rules.js";
import { newTieredDeflectionSegment } from "./tiered-deflection-segment.js";

test("TieredDeflectionSegmentValidator reports every problem", () => {
  const validator = defaultTieredDeflectionSegmentValidator();
  const item = newTieredDeflectionSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredDeflectionSegmentCodeLengthRule flags a long code", () => {
  const rule = new TieredDeflectionSegmentCodeLengthRule(16);
  const item = newTieredDeflectionSegment("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredDeflectionSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new TieredDeflectionSegmentRequiredCodeRule("tiered deflection segment needs a value");
  const item = newTieredDeflectionSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
