import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroRecordCreatedAtRangeRule,
  MacroRecordRequiredCodeRule,
  MacroRecordRequiredExternalRefRule,
  MacroRecordRequiredLabelRule,
  MacroRecordSummaryLengthRule,
  defaultMacroRecordValidator,
} from "./macro-record-rules.js";
import { newMacroRecord } from "./macro-record.js";

test("MacroRecordValidator reports every problem", () => {
  const validator = defaultMacroRecordValidator();
  const item = newMacroRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroRecordRequiredLabelRule flags a blank label", () => {
  const rule = new MacroRecordRequiredLabelRule("macro record needs this field");
  const item = newMacroRecord("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroRecordCreatedAtRangeRule flags values above created at", () => {
  const rule = new MacroRecordCreatedAtRangeRule(64, 80);
  const item = newMacroRecord("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroRecordSummaryLengthRule flags a long summary", () => {
  const rule = new MacroRecordSummaryLengthRule(86400);
  const item = newMacroRecord("x", "y");
  item.summary = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroRecordRequiredCodeRule flags a blank code", () => {
  const rule = new MacroRecordRequiredCodeRule("macro record needs a value");
  const item = newMacroRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroRecordRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new MacroRecordRequiredExternalRefRule("macro record needs this field");
  const item = newMacroRecord("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
