import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualTouchpointSegmentCostRangeRule,
  ManualTouchpointSegmentPriorityRangeRule,
  ManualTouchpointSegmentRateRangeRule,
  ManualTouchpointSegmentRequiredCategoryRule,
  ManualTouchpointSegmentRequiredCodeRule,
  defaultManualTouchpointSegmentValidator,
} from "./manual-touchpoint-segment-rules.js";
import { newManualTouchpointSegment } from "./manual-touchpoint-segment.js";

test("ManualTouchpointSegmentValidator reports every problem", () => {
  const validator = defaultManualTouchpointSegmentValidator();
  const item = newManualTouchpointSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualTouchpointSegmentRequiredCategoryRule flags a blank category", () => {
  const rule = new ManualTouchpointSegmentRequiredCategoryRule("manual touchpoint segment needs a value");
  const item = newManualTouchpointSegment("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualTouchpointSegmentRateRangeRule flags values above rate", () => {
  const rule = new ManualTouchpointSegmentRateRangeRule(4.6, 1392.8);
  const item = newManualTouchpointSegment("x", "y");
  item.rate = 1394.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualTouchpointSegmentPriorityRangeRule flags values above priority", () => {
  const rule = new ManualTouchpointSegmentPriorityRangeRule(80, 86400);
  const item = newManualTouchpointSegment("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualTouchpointSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new ManualTouchpointSegmentRequiredCodeRule("manual touchpoint segment needs an entry");
  const item = newManualTouchpointSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualTouchpointSegmentCostRangeRule flags values above cost", () => {
  const rule = new ManualTouchpointSegmentCostRangeRule(0.3, 4160.6);
  const item = newManualTouchpointSegment("x", "y");
  item.cost = 4162.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
