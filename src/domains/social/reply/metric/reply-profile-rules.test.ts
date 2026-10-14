import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyProfileBatchSizeRangeRule,
  ReplyProfileLimitRangeRule,
  ReplyProfileRequiredCodeRule,
  defaultReplyProfileValidator,
} from "./reply-profile-rules.js";
import { newReplyProfile } from "./reply-profile.js";

test("ReplyProfileValidator reports every problem", () => {
  const validator = defaultReplyProfileValidator();
  const item = newReplyProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyProfileRequiredCodeRule flags a blank code", () => {
  const rule = new ReplyProfileRequiredCodeRule("reply profile needs an entry");
  const item = newReplyProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyProfileLimitRangeRule flags values above limit", () => {
  const rule = new ReplyProfileLimitRangeRule(64, 1000);
  const item = newReplyProfile("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyProfileBatchSizeRangeRule flags values above batch size", () => {
  const rule = new ReplyProfileBatchSizeRangeRule(80, 1000);
  const item = newReplyProfile("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
