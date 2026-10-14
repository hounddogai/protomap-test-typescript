import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultTouchpointRecordLabelLengthRule,
  DefaultTouchpointRecordPriorityRangeRule,
  DefaultTouchpointRecordRequiredTitleRule,
  defaultDefaultTouchpointRecordValidator,
} from "./default-touchpoint-record-rules.js";
import { newDefaultTouchpointRecord } from "./default-touchpoint-record.js";

test("DefaultTouchpointRecordValidator reports every problem", () => {
  const validator = defaultDefaultTouchpointRecordValidator();
  const item = newDefaultTouchpointRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultTouchpointRecordPriorityRangeRule flags values above priority", () => {
  const rule = new DefaultTouchpointRecordPriorityRangeRule(32, 64);
  const item = newDefaultTouchpointRecord("x", "y");
  item.priority = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultTouchpointRecordRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultTouchpointRecordRequiredTitleRule("default touchpoint record needs a value");
  const item = newDefaultTouchpointRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultTouchpointRecordLabelLengthRule flags a long label", () => {
  const rule = new DefaultTouchpointRecordLabelLengthRule(1000);
  const item = newDefaultTouchpointRecord("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
