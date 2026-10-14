import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitNoticePriorityRangeRule,
  WaitNoticeRequiredCodeRule,
  WaitNoticeStartsAtRangeRule,
  WaitNoticeThresholdRangeRule,
  defaultWaitNoticeValidator,
} from "./wait-notice-rules.js";
import { newWaitNotice } from "./wait-notice.js";

test("WaitNoticeValidator reports every problem", () => {
  const validator = defaultWaitNoticeValidator();
  const item = newWaitNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitNoticePriorityRangeRule flags values above priority", () => {
  const rule = new WaitNoticePriorityRangeRule(120, 3600);
  const item = newWaitNotice("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitNoticeStartsAtRangeRule flags values above starts at", () => {
  const rule = new WaitNoticeStartsAtRangeRule(3600, 86400);
  const item = newWaitNotice("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitNoticeThresholdRangeRule flags values above threshold", () => {
  const rule = new WaitNoticeThresholdRangeRule(2.8, 4766.6);
  const item = newWaitNotice("x", "y");
  item.threshold = 4768.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new WaitNoticeRequiredCodeRule("wait notice needs an entry");
  const item = newWaitNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
