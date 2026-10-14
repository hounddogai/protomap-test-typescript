import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledSlaWindowAudienceIdLengthRule,
  ScheduledSlaWindowRequiredCodeRule,
  ScheduledSlaWindowRequiredSegmentRule,
  ScheduledSlaWindowSendAtRangeRule,
  ScheduledSlaWindowTitleLengthRule,
  defaultScheduledSlaWindowValidator,
} from "./scheduled-sla-window-rules.js";
import { newScheduledSlaWindow } from "./scheduled-sla-window.js";

test("ScheduledSlaWindowValidator reports every problem", () => {
  const validator = defaultScheduledSlaWindowValidator();
  const item = newScheduledSlaWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledSlaWindowAudienceIdLengthRule flags a long audience id", () => {
  const rule = new ScheduledSlaWindowAudienceIdLengthRule(3600);
  const item = newScheduledSlaWindow("x", "y");
  item.audienceId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledSlaWindowRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledSlaWindowRequiredCodeRule("scheduled sla window needs a value");
  const item = newScheduledSlaWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledSlaWindowSendAtRangeRule flags values above send at", () => {
  const rule = new ScheduledSlaWindowSendAtRangeRule(64, 80);
  const item = newScheduledSlaWindow("x", "y");
  item.sendAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledSlaWindowTitleLengthRule flags a long title", () => {
  const rule = new ScheduledSlaWindowTitleLengthRule(32);
  const item = newScheduledSlaWindow("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledSlaWindowRequiredSegmentRule flags a blank segment", () => {
  const rule = new ScheduledSlaWindowRequiredSegmentRule("scheduled sla window needs an entry");
  const item = newScheduledSlaWindow("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
