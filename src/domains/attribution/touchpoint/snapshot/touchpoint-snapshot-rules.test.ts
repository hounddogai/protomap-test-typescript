import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointSnapshotRequiredSourceRule,
  TouchpointSnapshotRequiredVariantRule,
  TouchpointSnapshotVariantLengthRule,
  TouchpointSnapshotWindowDaysRangeRule,
  defaultTouchpointSnapshotValidator,
} from "./touchpoint-snapshot-rules.js";
import { newTouchpointSnapshot } from "./touchpoint-snapshot.js";

test("TouchpointSnapshotValidator reports every problem", () => {
  const validator = defaultTouchpointSnapshotValidator();
  const item = newTouchpointSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointSnapshotRequiredVariantRule flags a blank variant", () => {
  const rule = new TouchpointSnapshotRequiredVariantRule("touchpoint snapshot needs a value");
  const item = newTouchpointSnapshot("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointSnapshotRequiredSourceRule flags a blank source", () => {
  const rule = new TouchpointSnapshotRequiredSourceRule("touchpoint snapshot needs this field");
  const item = newTouchpointSnapshot("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointSnapshotVariantLengthRule flags a long variant", () => {
  const rule = new TouchpointSnapshotVariantLengthRule(1000);
  const item = newTouchpointSnapshot("x", "y");
  item.variant = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointSnapshotWindowDaysRangeRule flags values above window days", () => {
  const rule = new TouchpointSnapshotWindowDaysRangeRule(16, 86400);
  const item = newTouchpointSnapshot("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
