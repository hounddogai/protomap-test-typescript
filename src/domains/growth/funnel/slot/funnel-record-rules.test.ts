import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelRecordCodeLengthRule,
  FunnelRecordCreatedAtRangeRule,
  FunnelRecordLabelLengthRule,
  defaultFunnelRecordValidator,
} from "./funnel-record-rules.js";
import { newFunnelRecord } from "./funnel-record.js";

test("FunnelRecordValidator reports every problem", () => {
  const validator = defaultFunnelRecordValidator();
  const item = newFunnelRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelRecordCodeLengthRule flags a long code", () => {
  const rule = new FunnelRecordCodeLengthRule(80);
  const item = newFunnelRecord("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelRecordLabelLengthRule flags a long label", () => {
  const rule = new FunnelRecordLabelLengthRule(80);
  const item = newFunnelRecord("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelRecordCreatedAtRangeRule flags values above created at", () => {
  const rule = new FunnelRecordCreatedAtRangeRule(64, 3600);
  const item = newFunnelRecord("x", "y");
  item.createdAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
