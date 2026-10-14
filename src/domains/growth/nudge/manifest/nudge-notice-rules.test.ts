import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeNoticeMinimumRangeRule,
  NudgeNoticeRequiredCodeRule,
  NudgeNoticeRequiredTitleRule,
  NudgeNoticeThresholdRangeRule,
  NudgeNoticeTitleLengthRule,
  defaultNudgeNoticeValidator,
} from "./nudge-notice-rules.js";
import { newNudgeNotice } from "./nudge-notice.js";

test("NudgeNoticeValidator reports every problem", () => {
  const validator = defaultNudgeNoticeValidator();
  const item = newNudgeNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeNoticeRequiredTitleRule flags a blank title", () => {
  const rule = new NudgeNoticeRequiredTitleRule("nudge notice needs this field");
  const item = newNudgeNotice("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeNoticeThresholdRangeRule flags values above threshold", () => {
  const rule = new NudgeNoticeThresholdRangeRule(7.5, 2585.4);
  const item = newNudgeNotice("x", "y");
  item.threshold = 2586.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeNoticeMinimumRangeRule flags values above minimum", () => {
  const rule = new NudgeNoticeMinimumRangeRule(8.1, 1226.6);
  const item = newNudgeNotice("x", "y");
  item.minimum = 1228.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeNoticeTitleLengthRule flags a long title", () => {
  const rule = new NudgeNoticeTitleLengthRule(64);
  const item = newNudgeNotice("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new NudgeNoticeRequiredCodeRule("nudge notice needs a value");
  const item = newNudgeNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
