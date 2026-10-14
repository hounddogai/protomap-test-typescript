import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledDeflectionRecordLabelLengthRule,
  ScheduledDeflectionRecordSummaryLengthRule,
  defaultScheduledDeflectionRecordValidator,
} from "./scheduled-deflection-record-rules.js";
import { newScheduledDeflectionRecord } from "./scheduled-deflection-record.js";

test("ScheduledDeflectionRecordValidator reports every problem", () => {
  const validator = defaultScheduledDeflectionRecordValidator();
  const item = newScheduledDeflectionRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledDeflectionRecordLabelLengthRule flags a long label", () => {
  const rule = new ScheduledDeflectionRecordLabelLengthRule(32);
  const item = newScheduledDeflectionRecord("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledDeflectionRecordSummaryLengthRule flags a long summary", () => {
  const rule = new ScheduledDeflectionRecordSummaryLengthRule(120);
  const item = newScheduledDeflectionRecord("x", "y");
  item.summary = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
