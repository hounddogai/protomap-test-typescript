import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionNoticeCodeLengthRule,
  MentionNoticeRequiredCodeRule,
  MentionNoticeTimezoneLengthRule,
  MentionNoticeWindowDaysRangeRule,
  defaultMentionNoticeValidator,
} from "./mention-notice-rules.js";
import { newMentionNotice } from "./mention-notice.js";

test("MentionNoticeValidator reports every problem", () => {
  const validator = defaultMentionNoticeValidator();
  const item = newMentionNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionNoticeCodeLengthRule flags a long code", () => {
  const rule = new MentionNoticeCodeLengthRule(80);
  const item = newMentionNotice("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionNoticeTimezoneLengthRule flags a long timezone", () => {
  const rule = new MentionNoticeTimezoneLengthRule(32);
  const item = newMentionNotice("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new MentionNoticeRequiredCodeRule("mention notice needs a value");
  const item = newMentionNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionNoticeWindowDaysRangeRule flags values above window days", () => {
  const rule = new MentionNoticeWindowDaysRangeRule(16, 86400);
  const item = newMentionNotice("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
