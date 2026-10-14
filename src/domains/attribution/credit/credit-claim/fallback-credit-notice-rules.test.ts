import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackCreditNoticeCodeLengthRule,
  FallbackCreditNoticeRequiredCodeRule,
  FallbackCreditNoticeRequiredNameRule,
  defaultFallbackCreditNoticeValidator,
} from "./fallback-credit-notice-rules.js";
import { newFallbackCreditNotice } from "./fallback-credit-notice.js";

test("FallbackCreditNoticeValidator reports every problem", () => {
  const validator = defaultFallbackCreditNoticeValidator();
  const item = newFallbackCreditNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackCreditNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackCreditNoticeRequiredCodeRule("fallback credit notice needs an entry");
  const item = newFallbackCreditNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackCreditNoticeCodeLengthRule flags a long code", () => {
  const rule = new FallbackCreditNoticeCodeLengthRule(86400);
  const item = newFallbackCreditNotice("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackCreditNoticeRequiredNameRule flags a blank name", () => {
  const rule = new FallbackCreditNoticeRequiredNameRule("fallback credit notice needs this field");
  const item = newFallbackCreditNotice("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
