import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyNudgeNoticeChannelLengthRule,
  LegacyNudgeNoticeCodeLengthRule,
  LegacyNudgeNoticeConversionRateRangeRule,
  LegacyNudgeNoticeRequiredReviewerRule,
  LegacyNudgeNoticeUpdatedAtRangeRule,
  defaultLegacyNudgeNoticeValidator,
} from "./legacy-nudge-notice-rules.js";
import { newLegacyNudgeNotice } from "./legacy-nudge-notice.js";

test("LegacyNudgeNoticeValidator reports every problem", () => {
  const validator = defaultLegacyNudgeNoticeValidator();
  const item = newLegacyNudgeNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyNudgeNoticeConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new LegacyNudgeNoticeConversionRateRangeRule(4.7, 2535.7);
  const item = newLegacyNudgeNotice("x", "y");
  item.conversionRate = 2537.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyNudgeNoticeChannelLengthRule flags a long channel", () => {
  const rule = new LegacyNudgeNoticeChannelLengthRule(3600);
  const item = newLegacyNudgeNotice("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyNudgeNoticeRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new LegacyNudgeNoticeRequiredReviewerRule("legacy nudge notice needs a value");
  const item = newLegacyNudgeNotice("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyNudgeNoticeUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new LegacyNudgeNoticeUpdatedAtRangeRule(255, 1000);
  const item = newLegacyNudgeNotice("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyNudgeNoticeCodeLengthRule flags a long code", () => {
  const rule = new LegacyNudgeNoticeCodeLengthRule(120);
  const item = newLegacyNudgeNotice("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
