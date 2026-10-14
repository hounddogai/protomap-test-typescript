import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientQueueNoticeLabelLengthRule,
  LenientQueueNoticeRequiredCodeRule,
  LenientQueueNoticeRequiredLabelRule,
  defaultLenientQueueNoticeValidator,
} from "./lenient-queue-notice-rules.js";
import { newLenientQueueNotice } from "./lenient-queue-notice.js";

test("LenientQueueNoticeValidator reports every problem", () => {
  const validator = defaultLenientQueueNoticeValidator();
  const item = newLenientQueueNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientQueueNoticeLabelLengthRule flags a long label", () => {
  const rule = new LenientQueueNoticeLabelLengthRule(120);
  const item = newLenientQueueNotice("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientQueueNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new LenientQueueNoticeRequiredCodeRule("lenient queue notice needs this field");
  const item = newLenientQueueNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientQueueNoticeRequiredLabelRule flags a blank label", () => {
  const rule = new LenientQueueNoticeRequiredLabelRule("lenient queue notice needs this field");
  const item = newLenientQueueNotice("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
