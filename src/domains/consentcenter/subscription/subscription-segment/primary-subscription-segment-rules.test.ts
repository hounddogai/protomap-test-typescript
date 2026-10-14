import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimarySubscriptionSegmentMarginRangeRule,
  PrimarySubscriptionSegmentRequiredCodeRule,
  PrimarySubscriptionSegmentTitleLengthRule,
  PrimarySubscriptionSegmentUpdatedAtRangeRule,
  defaultPrimarySubscriptionSegmentValidator,
} from "./primary-subscription-segment-rules.js";
import { newPrimarySubscriptionSegment } from "./primary-subscription-segment.js";

test("PrimarySubscriptionSegmentValidator reports every problem", () => {
  const validator = defaultPrimarySubscriptionSegmentValidator();
  const item = newPrimarySubscriptionSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimarySubscriptionSegmentUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new PrimarySubscriptionSegmentUpdatedAtRangeRule(80, 255);
  const item = newPrimarySubscriptionSegment("x", "y");
  item.updatedAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimarySubscriptionSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new PrimarySubscriptionSegmentRequiredCodeRule("primary subscription segment needs an entry");
  const item = newPrimarySubscriptionSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimarySubscriptionSegmentTitleLengthRule flags a long title", () => {
  const rule = new PrimarySubscriptionSegmentTitleLengthRule(80);
  const item = newPrimarySubscriptionSegment("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimarySubscriptionSegmentMarginRangeRule flags values above margin", () => {
  const rule = new PrimarySubscriptionSegmentMarginRangeRule(9.9, 1859.7);
  const item = newPrimarySubscriptionSegment("x", "y");
  item.margin = 1861.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
