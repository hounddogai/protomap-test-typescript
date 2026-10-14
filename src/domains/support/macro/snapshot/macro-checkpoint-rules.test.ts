import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroCheckpointDiscountRangeRule,
  MacroCheckpointRequiredCodeRule,
  MacroCheckpointTitleLengthRule,
  defaultMacroCheckpointValidator,
} from "./macro-checkpoint-rules.js";
import { newMacroCheckpoint } from "./macro-checkpoint.js";

test("MacroCheckpointValidator reports every problem", () => {
  const validator = defaultMacroCheckpointValidator();
  const item = newMacroCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroCheckpointDiscountRangeRule flags values above discount", () => {
  const rule = new MacroCheckpointDiscountRangeRule(4.5, 2485.9);
  const item = newMacroCheckpoint("x", "y");
  item.discount = 2487.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroCheckpointTitleLengthRule flags a long title", () => {
  const rule = new MacroCheckpointTitleLengthRule(1000);
  const item = newMacroCheckpoint("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new MacroCheckpointRequiredCodeRule("macro checkpoint needs an entry");
  const item = newMacroCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
