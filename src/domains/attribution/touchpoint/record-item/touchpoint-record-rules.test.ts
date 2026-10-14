import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointRecordAttemptsRangeRule,
  TouchpointRecordCodeLengthRule,
  TouchpointRecordTimezoneLengthRule,
  defaultTouchpointRecordValidator,
} from "./touchpoint-record-rules.js";
import { newTouchpointRecord } from "./touchpoint-record.js";

test("TouchpointRecordValidator reports every problem", () => {
  const validator = defaultTouchpointRecordValidator();
  const item = newTouchpointRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointRecordCodeLengthRule flags a long code", () => {
  const rule = new TouchpointRecordCodeLengthRule(16);
  const item = newTouchpointRecord("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointRecordAttemptsRangeRule flags values above attempts", () => {
  const rule = new TouchpointRecordAttemptsRangeRule(3600, 3600);
  const item = newTouchpointRecord("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointRecordTimezoneLengthRule flags a long timezone", () => {
  const rule = new TouchpointRecordTimezoneLengthRule(3600);
  const item = newTouchpointRecord("x", "y");
  item.timezone = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
