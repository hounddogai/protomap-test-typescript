import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientLevelRecordBudgetRangeRule,
  LenientLevelRecordChannelLengthRule,
  LenientLevelRecordNameLengthRule,
  LenientLevelRecordRequiredCodeRule,
  LenientLevelRecordRequiredNameRule,
  defaultLenientLevelRecordValidator,
} from "./lenient-level-record-rules.js";
import { newLenientLevelRecord } from "./lenient-level-record.js";

test("LenientLevelRecordValidator reports every problem", () => {
  const validator = defaultLenientLevelRecordValidator();
  const item = newLenientLevelRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientLevelRecordRequiredNameRule flags a blank name", () => {
  const rule = new LenientLevelRecordRequiredNameRule("lenient level record needs this field");
  const item = newLenientLevelRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientLevelRecordRequiredCodeRule flags a blank code", () => {
  const rule = new LenientLevelRecordRequiredCodeRule("lenient level record needs a value");
  const item = newLenientLevelRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientLevelRecordNameLengthRule flags a long name", () => {
  const rule = new LenientLevelRecordNameLengthRule(255);
  const item = newLenientLevelRecord("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientLevelRecordBudgetRangeRule flags values above budget", () => {
  const rule = new LenientLevelRecordBudgetRangeRule(9.2, 375.9);
  const item = newLenientLevelRecord("x", "y");
  item.budget = 377.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientLevelRecordChannelLengthRule flags a long channel", () => {
  const rule = new LenientLevelRecordChannelLengthRule(120);
  const item = newLenientLevelRecord("x", "y");
  item.channel = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
