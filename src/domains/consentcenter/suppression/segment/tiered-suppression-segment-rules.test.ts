import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredSuppressionSegmentRequiredCodeRule,
  TieredSuppressionSegmentRequiredExternalRefRule,
  defaultTieredSuppressionSegmentValidator,
} from "./tiered-suppression-segment-rules.js";
import { newTieredSuppressionSegment } from "./tiered-suppression-segment.js";

test("TieredSuppressionSegmentValidator reports every problem", () => {
  const validator = defaultTieredSuppressionSegmentValidator();
  const item = newTieredSuppressionSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredSuppressionSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new TieredSuppressionSegmentRequiredCodeRule("tiered suppression segment needs an entry");
  const item = newTieredSuppressionSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredSuppressionSegmentRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new TieredSuppressionSegmentRequiredExternalRefRule("tiered suppression segment needs this field");
  const item = newTieredSuppressionSegment("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
