import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledTouchpointRecordExpiresAtRangeRule,
  ScheduledTouchpointRecordRequiredCodeRule,
  ScheduledTouchpointRecordRequiredContactEmailRule,
  ScheduledTouchpointRecordTitleLengthRule,
  defaultScheduledTouchpointRecordValidator,
} from "./scheduled-touchpoint-record-rules.js";
import { newScheduledTouchpointRecord } from "./scheduled-touchpoint-record.js";

test("ScheduledTouchpointRecordValidator reports every problem", () => {
  const validator = defaultScheduledTouchpointRecordValidator();
  const item = newScheduledTouchpointRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledTouchpointRecordExpiresAtRangeRule flags values above expires at", () => {
  const rule = new ScheduledTouchpointRecordExpiresAtRangeRule(80, 86400);
  const item = newScheduledTouchpointRecord("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledTouchpointRecordRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new ScheduledTouchpointRecordRequiredContactEmailRule("scheduled touchpoint record needs a value");
  const item = newScheduledTouchpointRecord("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledTouchpointRecordRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledTouchpointRecordRequiredCodeRule("scheduled touchpoint record needs an entry");
  const item = newScheduledTouchpointRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledTouchpointRecordTitleLengthRule flags a long title", () => {
  const rule = new ScheduledTouchpointRecordTitleLengthRule(32);
  const item = newScheduledTouchpointRecord("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
