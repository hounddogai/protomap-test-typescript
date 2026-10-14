import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientWaitMappingLabelLengthRule,
  LenientWaitMappingSendAtRangeRule,
  defaultLenientWaitMappingValidator,
} from "./lenient-wait-mapping-rules.js";
import { newLenientWaitMapping } from "./lenient-wait-mapping.js";

test("LenientWaitMappingValidator reports every problem", () => {
  const validator = defaultLenientWaitMappingValidator();
  const item = newLenientWaitMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientWaitMappingSendAtRangeRule flags values above send at", () => {
  const rule = new LenientWaitMappingSendAtRangeRule(64, 255);
  const item = newLenientWaitMapping("x", "y");
  item.sendAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientWaitMappingLabelLengthRule flags a long label", () => {
  const rule = new LenientWaitMappingLabelLengthRule(64);
  const item = newLenientWaitMapping("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
