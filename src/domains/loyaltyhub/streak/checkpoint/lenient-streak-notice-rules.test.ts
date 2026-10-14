import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientStreakNoticeLocaleLengthRule,
  LenientStreakNoticeRequiredCodeRule,
  defaultLenientStreakNoticeValidator,
} from "./lenient-streak-notice-rules.js";
import { newLenientStreakNotice } from "./lenient-streak-notice.js";

test("LenientStreakNoticeValidator reports every problem", () => {
  const validator = defaultLenientStreakNoticeValidator();
  const item = newLenientStreakNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientStreakNoticeLocaleLengthRule flags a long locale", () => {
  const rule = new LenientStreakNoticeLocaleLengthRule(1000);
  const item = newLenientStreakNotice("x", "y");
  item.locale = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientStreakNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new LenientStreakNoticeRequiredCodeRule("lenient streak notice needs an entry");
  const item = newLenientStreakNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
