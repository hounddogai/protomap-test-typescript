import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedEscalationNoticeDurationMinutesRangeRule,
  BatchedEscalationNoticeLabelLengthRule,
  BatchedEscalationNoticeNameLengthRule,
  defaultBatchedEscalationNoticeValidator,
} from "./batched-escalation-notice-rules.js";
import { newBatchedEscalationNotice } from "./batched-escalation-notice.js";

test("BatchedEscalationNoticeValidator reports every problem", () => {
  const validator = defaultBatchedEscalationNoticeValidator();
  const item = newBatchedEscalationNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedEscalationNoticeNameLengthRule flags a long name", () => {
  const rule = new BatchedEscalationNoticeNameLengthRule(1000);
  const item = newBatchedEscalationNotice("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedEscalationNoticeDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new BatchedEscalationNoticeDurationMinutesRangeRule(64, 1000);
  const item = newBatchedEscalationNotice("x", "y");
  item.durationMinutes = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedEscalationNoticeLabelLengthRule flags a long label", () => {
  const rule = new BatchedEscalationNoticeLabelLengthRule(3600);
  const item = newBatchedEscalationNotice("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
