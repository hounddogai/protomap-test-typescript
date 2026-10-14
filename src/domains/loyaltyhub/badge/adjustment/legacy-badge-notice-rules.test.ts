import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyBadgeNoticeCodeLengthRule,
  LegacyBadgeNoticeEndsAtRangeRule,
  LegacyBadgeNoticeLabelLengthRule,
  LegacyBadgeNoticeRequiredCodeRule,
  LegacyBadgeNoticeRequiredTimezoneRule,
  defaultLegacyBadgeNoticeValidator,
} from "./legacy-badge-notice-rules.js";
import { newLegacyBadgeNotice } from "./legacy-badge-notice.js";

test("LegacyBadgeNoticeValidator reports every problem", () => {
  const validator = defaultLegacyBadgeNoticeValidator();
  const item = newLegacyBadgeNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyBadgeNoticeCodeLengthRule flags a long code", () => {
  const rule = new LegacyBadgeNoticeCodeLengthRule(3600);
  const item = newLegacyBadgeNotice("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyBadgeNoticeLabelLengthRule flags a long label", () => {
  const rule = new LegacyBadgeNoticeLabelLengthRule(16);
  const item = newLegacyBadgeNotice("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyBadgeNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyBadgeNoticeRequiredCodeRule("legacy badge notice needs an entry");
  const item = newLegacyBadgeNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyBadgeNoticeRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new LegacyBadgeNoticeRequiredTimezoneRule("legacy badge notice needs an entry");
  const item = newLegacyBadgeNotice("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyBadgeNoticeEndsAtRangeRule flags values above ends at", () => {
  const rule = new LegacyBadgeNoticeEndsAtRangeRule(32, 255);
  const item = newLegacyBadgeNotice("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
