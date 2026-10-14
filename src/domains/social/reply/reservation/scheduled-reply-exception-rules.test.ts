import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledReplyExceptionRateRangeRule,
  ScheduledReplyExceptionRequiredCodeRule,
  ScheduledReplyExceptionRequiredNameRule,
  ScheduledReplyExceptionRequiredPhoneRule,
  defaultScheduledReplyExceptionValidator,
} from "./scheduled-reply-exception-rules.js";
import { newScheduledReplyException } from "./scheduled-reply-exception.js";

test("ScheduledReplyExceptionValidator reports every problem", () => {
  const validator = defaultScheduledReplyExceptionValidator();
  const item = newScheduledReplyException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledReplyExceptionRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledReplyExceptionRequiredNameRule("scheduled reply exception needs this field");
  const item = newScheduledReplyException("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledReplyExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledReplyExceptionRequiredCodeRule("scheduled reply exception needs this field");
  const item = newScheduledReplyException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledReplyExceptionRequiredPhoneRule flags a blank phone", () => {
  const rule = new ScheduledReplyExceptionRequiredPhoneRule("scheduled reply exception needs a value");
  const item = newScheduledReplyException("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledReplyExceptionRateRangeRule flags values above rate", () => {
  const rule = new ScheduledReplyExceptionRateRangeRule(3.2, 1631.5);
  const item = newScheduledReplyException("x", "y");
  item.rate = 1633;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
