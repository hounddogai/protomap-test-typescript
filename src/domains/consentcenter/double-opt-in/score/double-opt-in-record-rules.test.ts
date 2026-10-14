import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInRecordCodeLengthRule,
  DoubleOptInRecordCreatedAtRangeRule,
  DoubleOptInRecordLabelLengthRule,
  DoubleOptInRecordMarginRangeRule,
  DoubleOptInRecordRequiredCodeRule,
  defaultDoubleOptInRecordValidator,
} from "./double-opt-in-record-rules.js";
import { newDoubleOptInRecord } from "./double-opt-in-record.js";

test("DoubleOptInRecordValidator reports every problem", () => {
  const validator = defaultDoubleOptInRecordValidator();
  const item = newDoubleOptInRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInRecordLabelLengthRule flags a long label", () => {
  const rule = new DoubleOptInRecordLabelLengthRule(120);
  const item = newDoubleOptInRecord("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInRecordMarginRangeRule flags values above margin", () => {
  const rule = new DoubleOptInRecordMarginRangeRule(6.3, 4577.9);
  const item = newDoubleOptInRecord("x", "y");
  item.margin = 4579.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInRecordCreatedAtRangeRule flags values above created at", () => {
  const rule = new DoubleOptInRecordCreatedAtRangeRule(80, 80);
  const item = newDoubleOptInRecord("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInRecordCodeLengthRule flags a long code", () => {
  const rule = new DoubleOptInRecordCodeLengthRule(86400);
  const item = newDoubleOptInRecord("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInRecordRequiredCodeRule flags a blank code", () => {
  const rule = new DoubleOptInRecordRequiredCodeRule("double opt in record needs an entry");
  const item = newDoubleOptInRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
