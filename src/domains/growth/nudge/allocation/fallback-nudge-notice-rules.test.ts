import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackNudgeNoticeImpressionsRangeRule,
  FallbackNudgeNoticeTitleLengthRule,
  FallbackNudgeNoticeUnitLengthRule,
  defaultFallbackNudgeNoticeValidator,
} from "./fallback-nudge-notice-rules.js";
import { newFallbackNudgeNotice } from "./fallback-nudge-notice.js";

test("FallbackNudgeNoticeValidator reports every problem", () => {
  const validator = defaultFallbackNudgeNoticeValidator();
  const item = newFallbackNudgeNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackNudgeNoticeTitleLengthRule flags a long title", () => {
  const rule = new FallbackNudgeNoticeTitleLengthRule(86400);
  const item = newFallbackNudgeNotice("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackNudgeNoticeUnitLengthRule flags a long unit", () => {
  const rule = new FallbackNudgeNoticeUnitLengthRule(120);
  const item = newFallbackNudgeNotice("x", "y");
  item.unit = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackNudgeNoticeImpressionsRangeRule flags values above impressions", () => {
  const rule = new FallbackNudgeNoticeImpressionsRangeRule(120, 255);
  const item = newFallbackNudgeNotice("x", "y");
  item.impressions = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
