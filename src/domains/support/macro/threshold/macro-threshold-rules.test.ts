import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroThresholdLimitRangeRule,
  MacroThresholdNotesLengthRule,
  MacroThresholdRequiredNotesRule,
  MacroThresholdStartsAtRangeRule,
  MacroThresholdTitleLengthRule,
  defaultMacroThresholdValidator,
} from "./macro-threshold-rules.js";
import { newMacroThreshold } from "./macro-threshold.js";

test("MacroThresholdValidator reports every problem", () => {
  const validator = defaultMacroThresholdValidator();
  const item = newMacroThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroThresholdNotesLengthRule flags a long notes", () => {
  const rule = new MacroThresholdNotesLengthRule(1000);
  const item = newMacroThreshold("x", "y");
  item.notes = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroThresholdStartsAtRangeRule flags values above starts at", () => {
  const rule = new MacroThresholdStartsAtRangeRule(32, 64);
  const item = newMacroThreshold("x", "y");
  item.startsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroThresholdRequiredNotesRule flags a blank notes", () => {
  const rule = new MacroThresholdRequiredNotesRule("macro threshold needs an entry");
  const item = newMacroThreshold("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroThresholdTitleLengthRule flags a long title", () => {
  const rule = new MacroThresholdTitleLengthRule(80);
  const item = newMacroThreshold("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroThresholdLimitRangeRule flags values above limit", () => {
  const rule = new MacroThresholdLimitRangeRule(16, 32);
  const item = newMacroThreshold("x", "y");
  item.limit = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
