import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultCsatRecordBudgetRangeRule,
  DefaultCsatRecordCodeLengthRule,
  DefaultCsatRecordExpiresAtRangeRule,
  DefaultCsatRecordLocaleLengthRule,
  DefaultCsatRecordRequiredCodeRule,
  defaultDefaultCsatRecordValidator,
} from "./default-csat-record-rules.js";
import { newDefaultCsatRecord } from "./default-csat-record.js";

test("DefaultCsatRecordValidator reports every problem", () => {
  const validator = defaultDefaultCsatRecordValidator();
  const item = newDefaultCsatRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultCsatRecordBudgetRangeRule flags values above budget", () => {
  const rule = new DefaultCsatRecordBudgetRangeRule(0.6, 4647);
  const item = newDefaultCsatRecord("x", "y");
  item.budget = 4648.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultCsatRecordExpiresAtRangeRule flags values above expires at", () => {
  const rule = new DefaultCsatRecordExpiresAtRangeRule(16, 255);
  const item = newDefaultCsatRecord("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultCsatRecordLocaleLengthRule flags a long locale", () => {
  const rule = new DefaultCsatRecordLocaleLengthRule(32);
  const item = newDefaultCsatRecord("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultCsatRecordCodeLengthRule flags a long code", () => {
  const rule = new DefaultCsatRecordCodeLengthRule(80);
  const item = newDefaultCsatRecord("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultCsatRecordRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultCsatRecordRequiredCodeRule("default csat record needs this field");
  const item = newDefaultCsatRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
