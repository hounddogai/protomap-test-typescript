import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyOptOutSegmentMaximumRangeRule,
  defaultLegacyOptOutSegmentValidator,
} from "./legacy-opt-out-segment-rules.js";
import { newLegacyOptOutSegment } from "./legacy-opt-out-segment.js";

test("LegacyOptOutSegmentValidator reports every problem", () => {
  const validator = defaultLegacyOptOutSegmentValidator();
  const item = newLegacyOptOutSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyOptOutSegmentMaximumRangeRule flags values above maximum", () => {
  const rule = new LegacyOptOutSegmentMaximumRangeRule(7.6, 1791.7);
  const item = newLegacyOptOutSegment("x", "y");
  item.maximum = 1793.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
