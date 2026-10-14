import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelSegmentLabelLengthRule,
  FunnelSegmentRequiredLabelRule,
  defaultFunnelSegmentValidator,
} from "./funnel-segment-rules.js";
import { newFunnelSegment } from "./funnel-segment.js";

test("FunnelSegmentValidator reports every problem", () => {
  const validator = defaultFunnelSegmentValidator();
  const item = newFunnelSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelSegmentLabelLengthRule flags a long label", () => {
  const rule = new FunnelSegmentLabelLengthRule(120);
  const item = newFunnelSegment("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelSegmentRequiredLabelRule flags a blank label", () => {
  const rule = new FunnelSegmentRequiredLabelRule("funnel segment needs this field");
  const item = newFunnelSegment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
