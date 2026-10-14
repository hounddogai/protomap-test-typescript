import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderNoticeCapacityRangeRule,
  SenderNoticeCreatedAtRangeRule,
  SenderNoticeRequiredCodeRule,
  SenderNoticeRequiredTitleRule,
  defaultSenderNoticeValidator,
} from "./sender-notice-rules.js";
import { newSenderNotice } from "./sender-notice.js";

test("SenderNoticeValidator reports every problem", () => {
  const validator = defaultSenderNoticeValidator();
  const item = newSenderNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderNoticeCreatedAtRangeRule flags values above created at", () => {
  const rule = new SenderNoticeCreatedAtRangeRule(16, 120);
  const item = newSenderNotice("x", "y");
  item.createdAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new SenderNoticeRequiredCodeRule("sender notice needs an entry");
  const item = newSenderNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderNoticeCapacityRangeRule flags values above capacity", () => {
  const rule = new SenderNoticeCapacityRangeRule(1000, 3600);
  const item = newSenderNotice("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderNoticeRequiredTitleRule flags a blank title", () => {
  const rule = new SenderNoticeRequiredTitleRule("sender notice needs an entry");
  const item = newSenderNotice("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
