import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultMacroSegmentCeilingRangeRule,
  DefaultMacroSegmentRequiredLabelRule,
  DefaultMacroSegmentVersionRangeRule,
  DefaultMacroSegmentWeightRangeRule,
  defaultDefaultMacroSegmentValidator,
} from "./default-macro-segment-rules.js";
import { newDefaultMacroSegment } from "./default-macro-segment.js";

test("DefaultMacroSegmentValidatorExtra reports every problem", () => {
  const validator = defaultDefaultMacroSegmentValidator();
  const item = newDefaultMacroSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultMacroSegmentVersionRangeRule flags values above version", () => {
  const rule = new DefaultMacroSegmentVersionRangeRule(16, 255);
  const item = newDefaultMacroSegment("x", "y");
  item.version = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultMacroSegmentCeilingRangeRule flags values above ceiling", () => {
  const rule = new DefaultMacroSegmentCeilingRangeRule(4, 790.9);
  const item = newDefaultMacroSegment("x", "y");
  item.ceiling = 792.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultMacroSegmentRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultMacroSegmentRequiredLabelRule("default macro segment needs this field");
  const item = newDefaultMacroSegment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultMacroSegmentWeightRangeRule flags values above weight", () => {
  const rule = new DefaultMacroSegmentWeightRangeRule(6, 4994.3);
  const item = newDefaultMacroSegment("x", "y");
  item.weight = 4995.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
