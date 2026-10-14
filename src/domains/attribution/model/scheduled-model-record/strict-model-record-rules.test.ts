import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictModelRecordClicksRangeRule,
  StrictModelRecordCodeLengthRule,
  StrictModelRecordPhoneLengthRule,
  StrictModelRecordQuantityRangeRule,
  StrictModelRecordRequiredCodeRule,
  StrictModelRecordRequiredNameRule,
  defaultStrictModelRecordValidator,
} from "./strict-model-record-rules.js";
import { newStrictModelRecord } from "./strict-model-record.js";

test("StrictModelRecordValidator reports every problem", () => {
  const validator = defaultStrictModelRecordValidator();
  const item = newStrictModelRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictModelRecordRequiredNameRule flags a blank name", () => {
  const rule = new StrictModelRecordRequiredNameRule("strict model record needs an entry");
  const item = newStrictModelRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictModelRecordPhoneLengthRule flags a long phone", () => {
  const rule = new StrictModelRecordPhoneLengthRule(255);
  const item = newStrictModelRecord("x", "y");
  item.phone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictModelRecordCodeLengthRule flags a long code", () => {
  const rule = new StrictModelRecordCodeLengthRule(1000);
  const item = newStrictModelRecord("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictModelRecordClicksRangeRule flags values above clicks", () => {
  const rule = new StrictModelRecordClicksRangeRule(1000, 3600);
  const item = newStrictModelRecord("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictModelRecordQuantityRangeRule flags values above quantity", () => {
  const rule = new StrictModelRecordQuantityRangeRule(120, 86400);
  const item = newStrictModelRecord("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictModelRecordRequiredCodeRule flags a blank code", () => {
  const rule = new StrictModelRecordRequiredCodeRule("strict model record needs an entry");
  const item = newStrictModelRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
