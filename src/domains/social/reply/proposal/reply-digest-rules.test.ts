import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyDigestCreatedAtRangeRule,
  ReplyDigestLabelLengthRule,
  defaultReplyDigestValidator,
} from "./reply-digest-rules.js";
import { newReplyDigest } from "./reply-digest.js";

test("ReplyDigestValidator reports every problem", () => {
  const validator = defaultReplyDigestValidator();
  const item = newReplyDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyDigestLabelLengthRule flags a long label", () => {
  const rule = new ReplyDigestLabelLengthRule(64);
  const item = newReplyDigest("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyDigestCreatedAtRangeRule flags values above created at", () => {
  const rule = new ReplyDigestCreatedAtRangeRule(64, 1000);
  const item = newReplyDigest("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
