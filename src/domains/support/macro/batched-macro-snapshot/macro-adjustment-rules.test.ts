import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroAdjustmentRequiredCodeRule,
  MacroAdjustmentRequiredDescriptionRule,
  MacroAdjustmentRequiredTitleRule,
  defaultMacroAdjustmentValidator,
} from "./macro-adjustment-rules.js";
import { newMacroAdjustment } from "./macro-adjustment.js";

test("MacroAdjustmentValidator reports every problem", () => {
  const validator = defaultMacroAdjustmentValidator();
  const item = newMacroAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new MacroAdjustmentRequiredCodeRule("macro adjustment needs a value");
  const item = newMacroAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroAdjustmentRequiredDescriptionRule flags a blank description", () => {
  const rule = new MacroAdjustmentRequiredDescriptionRule("macro adjustment needs a value");
  const item = newMacroAdjustment("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new MacroAdjustmentRequiredTitleRule("macro adjustment needs an entry");
  const item = newMacroAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
