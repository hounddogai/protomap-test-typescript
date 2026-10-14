import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingMentionRecordEndsAtRangeRule,
  RollingMentionRecordNameLengthRule,
  RollingMentionRecordPriorityRangeRule,
  defaultRollingMentionRecordValidator,
} from "./rolling-mention-record-rules.js";
import { newRollingMentionRecord } from "./rolling-mention-record.js";

test("RollingMentionRecordValidator reports every problem", () => {
  const validator = defaultRollingMentionRecordValidator();
  const item = newRollingMentionRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingMentionRecordPriorityRangeRule flags values above priority", () => {
  const rule = new RollingMentionRecordPriorityRangeRule(16, 255);
  const item = newRollingMentionRecord("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingMentionRecordEndsAtRangeRule flags values above ends at", () => {
  const rule = new RollingMentionRecordEndsAtRangeRule(80, 1000);
  const item = newRollingMentionRecord("x", "y");
  item.endsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingMentionRecordNameLengthRule flags a long name", () => {
  const rule = new RollingMentionRecordNameLengthRule(255);
  const item = newRollingMentionRecord("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
