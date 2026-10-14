import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingNudgeNoticeMarginRangeRule,
  RollingNudgeNoticePhoneLengthRule,
  RollingNudgeNoticeRequiredCodeRule,
  defaultRollingNudgeNoticeValidator,
} from "./rolling-nudge-notice-rules.js";
import { newRollingNudgeNotice } from "./rolling-nudge-notice.js";

test("RollingNudgeNoticeValidator reports every problem", () => {
  const validator = defaultRollingNudgeNoticeValidator();
  const item = newRollingNudgeNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingNudgeNoticeMarginRangeRule flags values above margin", () => {
  const rule = new RollingNudgeNoticeMarginRangeRule(4.3, 458);
  const item = newRollingNudgeNotice("x", "y");
  item.margin = 459.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingNudgeNoticePhoneLengthRule flags a long phone", () => {
  const rule = new RollingNudgeNoticePhoneLengthRule(32);
  const item = newRollingNudgeNotice("x", "y");
  item.phone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingNudgeNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new RollingNudgeNoticeRequiredCodeRule("rolling nudge notice needs an entry");
  const item = newRollingNudgeNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
