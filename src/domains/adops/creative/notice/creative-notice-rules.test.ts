import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeNoticeAttemptsRangeRule,
  CreativeNoticeLocaleLengthRule,
  defaultCreativeNoticeValidator,
} from "./creative-notice-rules.js";
import { newCreativeNotice } from "./creative-notice.js";

test("CreativeNoticeValidator reports every problem", () => {
  const validator = defaultCreativeNoticeValidator();
  const item = newCreativeNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeNoticeAttemptsRangeRule flags values above attempts", () => {
  const rule = new CreativeNoticeAttemptsRangeRule(1000, 86400);
  const item = newCreativeNotice("x", "y");
  item.attempts = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeNoticeLocaleLengthRule flags a long locale", () => {
  const rule = new CreativeNoticeLocaleLengthRule(32);
  const item = newCreativeNotice("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
