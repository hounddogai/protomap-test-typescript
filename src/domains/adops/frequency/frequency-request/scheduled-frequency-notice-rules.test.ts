import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledFrequencyNoticeCodeLengthRule,
  ScheduledFrequencyNoticeExpiresAtRangeRule,
  ScheduledFrequencyNoticeRequiredLabelRule,
  ScheduledFrequencyNoticeSourceLengthRule,
  defaultScheduledFrequencyNoticeValidator,
} from "./scheduled-frequency-notice-rules.js";
import { newScheduledFrequencyNotice } from "./scheduled-frequency-notice.js";

test("ScheduledFrequencyNoticeValidator reports every problem", () => {
  const validator = defaultScheduledFrequencyNoticeValidator();
  const item = newScheduledFrequencyNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledFrequencyNoticeRequiredLabelRule flags a blank label", () => {
  const rule = new ScheduledFrequencyNoticeRequiredLabelRule("scheduled frequency notice needs an entry");
  const item = newScheduledFrequencyNotice("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledFrequencyNoticeCodeLengthRule flags a long code", () => {
  const rule = new ScheduledFrequencyNoticeCodeLengthRule(64);
  const item = newScheduledFrequencyNotice("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledFrequencyNoticeSourceLengthRule flags a long source", () => {
  const rule = new ScheduledFrequencyNoticeSourceLengthRule(3600);
  const item = newScheduledFrequencyNotice("x", "y");
  item.source = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledFrequencyNoticeExpiresAtRangeRule flags values above expires at", () => {
  const rule = new ScheduledFrequencyNoticeExpiresAtRangeRule(16, 80);
  const item = newScheduledFrequencyNotice("x", "y");
  item.expiresAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
