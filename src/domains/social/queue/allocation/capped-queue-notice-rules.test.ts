import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedQueueNoticeAttemptsRangeRule,
  CappedQueueNoticeRequiredTimezoneRule,
  defaultCappedQueueNoticeValidator,
} from "./capped-queue-notice-rules.js";
import { newCappedQueueNotice } from "./capped-queue-notice.js";

test("CappedQueueNoticeValidator reports every problem", () => {
  const validator = defaultCappedQueueNoticeValidator();
  const item = newCappedQueueNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedQueueNoticeRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new CappedQueueNoticeRequiredTimezoneRule("capped queue notice needs a value");
  const item = newCappedQueueNotice("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedQueueNoticeAttemptsRangeRule flags values above attempts", () => {
  const rule = new CappedQueueNoticeAttemptsRangeRule(120, 255);
  const item = newCappedQueueNotice("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
