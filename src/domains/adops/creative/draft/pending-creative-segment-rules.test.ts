import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingCreativeSegmentExpiresAtRangeRule,
  PendingCreativeSegmentRequiredTitleRule,
  defaultPendingCreativeSegmentValidator,
} from "./pending-creative-segment-rules.js";
import { newPendingCreativeSegment } from "./pending-creative-segment.js";

test("PendingCreativeSegmentValidator reports every problem", () => {
  const validator = defaultPendingCreativeSegmentValidator();
  const item = newPendingCreativeSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingCreativeSegmentExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PendingCreativeSegmentExpiresAtRangeRule(64, 86400);
  const item = newPendingCreativeSegment("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingCreativeSegmentRequiredTitleRule flags a blank title", () => {
  const rule = new PendingCreativeSegmentRequiredTitleRule("pending creative segment needs an entry");
  const item = newPendingCreativeSegment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
