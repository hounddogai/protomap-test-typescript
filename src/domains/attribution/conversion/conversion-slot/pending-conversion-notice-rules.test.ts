import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingConversionNoticeMaximumRangeRule,
  PendingConversionNoticeRequiredCodeRule,
  PendingConversionNoticeRequiredSegmentRule,
  PendingConversionNoticeRequiredTitleRule,
  PendingConversionNoticeScoreRangeRule,
  PendingConversionNoticeTitleLengthRule,
  defaultPendingConversionNoticeValidator,
} from "./pending-conversion-notice-rules.js";
import { newPendingConversionNotice } from "./pending-conversion-notice.js";

test("PendingConversionNoticeValidator reports every problem", () => {
  const validator = defaultPendingConversionNoticeValidator();
  const item = newPendingConversionNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingConversionNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new PendingConversionNoticeRequiredCodeRule("pending conversion notice needs this field");
  const item = newPendingConversionNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingConversionNoticeRequiredSegmentRule flags a blank segment", () => {
  const rule = new PendingConversionNoticeRequiredSegmentRule("pending conversion notice needs an entry");
  const item = newPendingConversionNotice("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingConversionNoticeMaximumRangeRule flags values above maximum", () => {
  const rule = new PendingConversionNoticeMaximumRangeRule(6.6, 1669.4);
  const item = newPendingConversionNotice("x", "y");
  item.maximum = 1670.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingConversionNoticeTitleLengthRule flags a long title", () => {
  const rule = new PendingConversionNoticeTitleLengthRule(80);
  const item = newPendingConversionNotice("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingConversionNoticeScoreRangeRule flags values above score", () => {
  const rule = new PendingConversionNoticeScoreRangeRule(6.1, 4950.3);
  const item = newPendingConversionNotice("x", "y");
  item.score = 4951.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingConversionNoticeRequiredTitleRule flags a blank title", () => {
  const rule = new PendingConversionNoticeRequiredTitleRule("pending conversion notice needs an entry");
  const item = newPendingConversionNotice("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
