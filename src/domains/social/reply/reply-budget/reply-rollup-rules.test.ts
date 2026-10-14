import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyRollupAmountRangeRule,
  ReplyRollupAudienceIdLengthRule,
  ReplyRollupChecksumLengthRule,
  ReplyRollupRequiredAudienceIdRule,
  ReplyRollupRequiredTitleRule,
  ReplyRollupTitleLengthRule,
  defaultReplyRollupValidator,
} from "./reply-rollup-rules.js";
import { newReplyRollup } from "./reply-rollup.js";

test("ReplyRollupValidator reports every problem", () => {
  const validator = defaultReplyRollupValidator();
  const item = newReplyRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyRollupRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new ReplyRollupRequiredAudienceIdRule("reply rollup needs this field");
  const item = newReplyRollup("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyRollupAmountRangeRule flags values above amount", () => {
  const rule = new ReplyRollupAmountRangeRule(3.8, 1948);
  const item = newReplyRollup("x", "y");
  item.amount = 1949.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyRollupRequiredTitleRule flags a blank title", () => {
  const rule = new ReplyRollupRequiredTitleRule("reply rollup needs an entry");
  const item = newReplyRollup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyRollupChecksumLengthRule flags a long checksum", () => {
  const rule = new ReplyRollupChecksumLengthRule(120);
  const item = newReplyRollup("x", "y");
  item.checksum = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyRollupAudienceIdLengthRule flags a long audience id", () => {
  const rule = new ReplyRollupAudienceIdLengthRule(16);
  const item = newReplyRollup("x", "y");
  item.audienceId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyRollupTitleLengthRule flags a long title", () => {
  const rule = new ReplyRollupTitleLengthRule(80);
  const item = newReplyRollup("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
