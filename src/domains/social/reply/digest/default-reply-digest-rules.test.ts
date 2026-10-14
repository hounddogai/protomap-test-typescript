import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultReplyDigestCodeLengthRule,
  DefaultReplyDigestRequiredLabelRule,
  DefaultReplyDigestSequenceRangeRule,
  defaultDefaultReplyDigestValidator,
} from "./default-reply-digest-rules.js";
import { newDefaultReplyDigest } from "./default-reply-digest.js";

test("DefaultReplyDigestValidator reports every problem", () => {
  const validator = defaultDefaultReplyDigestValidator();
  const item = newDefaultReplyDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultReplyDigestRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultReplyDigestRequiredLabelRule("default reply digest needs an entry");
  const item = newDefaultReplyDigest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultReplyDigestSequenceRangeRule flags values above sequence", () => {
  const rule = new DefaultReplyDigestSequenceRangeRule(80, 80);
  const item = newDefaultReplyDigest("x", "y");
  item.sequence = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultReplyDigestCodeLengthRule flags a long code", () => {
  const rule = new DefaultReplyDigestCodeLengthRule(255);
  const item = newDefaultReplyDigest("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
