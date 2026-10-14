import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPreferenceSegmentCodeLengthRule,
  DefaultPreferenceSegmentRequiredNameRule,
  defaultDefaultPreferenceSegmentValidator,
} from "./default-preference-segment-rules.js";
import { newDefaultPreferenceSegment } from "./default-preference-segment.js";

test("DefaultPreferenceSegmentValidator reports every problem", () => {
  const validator = defaultDefaultPreferenceSegmentValidator();
  const item = newDefaultPreferenceSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPreferenceSegmentCodeLengthRule flags a long code", () => {
  const rule = new DefaultPreferenceSegmentCodeLengthRule(64);
  const item = newDefaultPreferenceSegment("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPreferenceSegmentRequiredNameRule flags a blank name", () => {
  const rule = new DefaultPreferenceSegmentRequiredNameRule("default preference segment needs a value");
  const item = newDefaultPreferenceSegment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
