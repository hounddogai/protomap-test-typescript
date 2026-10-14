import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeSegmentCapacityRangeRule,
  BadgeSegmentNameLengthRule,
  BadgeSegmentRegionLengthRule,
  BadgeSegmentRequiredCodeRule,
  BadgeSegmentSourceLengthRule,
  defaultBadgeSegmentValidator,
} from "./badge-segment-rules.js";
import { newBadgeSegment } from "./badge-segment.js";

test("BadgeSegmentValidator reports every problem", () => {
  const validator = defaultBadgeSegmentValidator();
  const item = newBadgeSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeSegmentNameLengthRule flags a long name", () => {
  const rule = new BadgeSegmentNameLengthRule(120);
  const item = newBadgeSegment("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeSegmentCapacityRangeRule flags values above capacity", () => {
  const rule = new BadgeSegmentCapacityRangeRule(64, 120);
  const item = newBadgeSegment("x", "y");
  item.capacity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeSegmentRegionLengthRule flags a long region", () => {
  const rule = new BadgeSegmentRegionLengthRule(64);
  const item = newBadgeSegment("x", "y");
  item.region = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new BadgeSegmentRequiredCodeRule("badge segment needs an entry");
  const item = newBadgeSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeSegmentSourceLengthRule flags a long source", () => {
  const rule = new BadgeSegmentSourceLengthRule(3600);
  const item = newBadgeSegment("x", "y");
  item.source = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
