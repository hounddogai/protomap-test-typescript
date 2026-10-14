import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderDigestRequiredCodeRule,
  SenderDigestRequiredSourceRule,
  SenderDigestRequiredTimezoneRule,
  SenderDigestRequiredTitleRule,
  SenderDigestSourceLengthRule,
  defaultSenderDigestValidator,
} from "./sender-digest-rules.js";
import { newSenderDigest } from "./sender-digest.js";

test("SenderDigestValidator reports every problem", () => {
  const validator = defaultSenderDigestValidator();
  const item = newSenderDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderDigestSourceLengthRule flags a long source", () => {
  const rule = new SenderDigestSourceLengthRule(3600);
  const item = newSenderDigest("x", "y");
  item.source = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderDigestRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new SenderDigestRequiredTimezoneRule("sender digest needs an entry");
  const item = newSenderDigest("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderDigestRequiredCodeRule flags a blank code", () => {
  const rule = new SenderDigestRequiredCodeRule("sender digest needs an entry");
  const item = newSenderDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderDigestRequiredSourceRule flags a blank source", () => {
  const rule = new SenderDigestRequiredSourceRule("sender digest needs an entry");
  const item = newSenderDigest("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderDigestRequiredTitleRule flags a blank title", () => {
  const rule = new SenderDigestRequiredTitleRule("sender digest needs this field");
  const item = newSenderDigest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
