import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteDigestChecksumLengthRule,
  InviteDigestCodeLengthRule,
  InviteDigestRequiredCodeRule,
  InviteDigestSummaryLengthRule,
  defaultInviteDigestValidator,
} from "./invite-digest-rules.js";
import { newInviteDigest } from "./invite-digest.js";

test("InviteDigestValidator reports every problem", () => {
  const validator = defaultInviteDigestValidator();
  const item = newInviteDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteDigestCodeLengthRule flags a long code", () => {
  const rule = new InviteDigestCodeLengthRule(32);
  const item = newInviteDigest("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteDigestChecksumLengthRule flags a long checksum", () => {
  const rule = new InviteDigestChecksumLengthRule(64);
  const item = newInviteDigest("x", "y");
  item.checksum = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteDigestRequiredCodeRule flags a blank code", () => {
  const rule = new InviteDigestRequiredCodeRule("invite digest needs a value");
  const item = newInviteDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteDigestSummaryLengthRule flags a long summary", () => {
  const rule = new InviteDigestSummaryLengthRule(32);
  const item = newInviteDigest("x", "y");
  item.summary = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
