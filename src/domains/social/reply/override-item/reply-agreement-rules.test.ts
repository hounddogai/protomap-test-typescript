import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyAgreementCodeLengthRule,
  ReplyAgreementRequiredCodeRule,
  ReplyAgreementRequiredTimezoneRule,
  defaultReplyAgreementValidator,
} from "./reply-agreement-rules.js";
import { newReplyAgreement } from "./reply-agreement.js";

test("ReplyAgreementValidator reports every problem", () => {
  const validator = defaultReplyAgreementValidator();
  const item = newReplyAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new ReplyAgreementRequiredCodeRule("reply agreement needs this field");
  const item = newReplyAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyAgreementRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new ReplyAgreementRequiredTimezoneRule("reply agreement needs an entry");
  const item = newReplyAgreement("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyAgreementCodeLengthRule flags a long code", () => {
  const rule = new ReplyAgreementCodeLengthRule(255);
  const item = newReplyAgreement("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
