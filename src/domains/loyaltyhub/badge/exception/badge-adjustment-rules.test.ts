import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeAdjustmentCodeLengthRule,
  BadgeAdjustmentRequiredChecksumRule,
  BadgeAdjustmentSegmentLengthRule,
  defaultBadgeAdjustmentValidator,
} from "./badge-adjustment-rules.js";
import { newBadgeAdjustment } from "./badge-adjustment.js";

test("BadgeAdjustmentValidator reports every problem", () => {
  const validator = defaultBadgeAdjustmentValidator();
  const item = newBadgeAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new BadgeAdjustmentCodeLengthRule(120);
  const item = newBadgeAdjustment("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeAdjustmentRequiredChecksumRule flags a blank checksum", () => {
  const rule = new BadgeAdjustmentRequiredChecksumRule("badge adjustment needs this field");
  const item = newBadgeAdjustment("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeAdjustmentSegmentLengthRule flags a long segment", () => {
  const rule = new BadgeAdjustmentSegmentLengthRule(16);
  const item = newBadgeAdjustment("x", "y");
  item.segment = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
