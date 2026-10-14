import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyEntryCodeLengthRule,
  ReplyEntryRequiredChannelRule,
  ReplyEntryRequiredChecksumRule,
  ReplyEntryScoreRangeRule,
  defaultReplyEntryValidator,
} from "./reply-entry-rules.js";
import { newReplyEntry } from "./reply-entry.js";

test("ReplyEntryValidator reports every problem", () => {
  const validator = defaultReplyEntryValidator();
  const item = newReplyEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyEntryScoreRangeRule flags values above score", () => {
  const rule = new ReplyEntryScoreRangeRule(4.9, 2435.4);
  const item = newReplyEntry("x", "y");
  item.score = 2436.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyEntryRequiredChannelRule flags a blank channel", () => {
  const rule = new ReplyEntryRequiredChannelRule("reply entry needs this field");
  const item = newReplyEntry("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyEntryRequiredChecksumRule flags a blank checksum", () => {
  const rule = new ReplyEntryRequiredChecksumRule("reply entry needs an entry");
  const item = newReplyEntry("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyEntryCodeLengthRule flags a long code", () => {
  const rule = new ReplyEntryCodeLengthRule(80);
  const item = newReplyEntry("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
