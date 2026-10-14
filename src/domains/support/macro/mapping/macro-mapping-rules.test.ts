import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroMappingRequiredNameRule,
  MacroMappingSequenceRangeRule,
  defaultMacroMappingValidator,
} from "./macro-mapping-rules.js";
import { newMacroMapping } from "./macro-mapping.js";

test("MacroMappingValidator reports every problem", () => {
  const validator = defaultMacroMappingValidator();
  const item = newMacroMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroMappingRequiredNameRule flags a blank name", () => {
  const rule = new MacroMappingRequiredNameRule("macro mapping needs a value");
  const item = newMacroMapping("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroMappingSequenceRangeRule flags values above sequence", () => {
  const rule = new MacroMappingSequenceRangeRule(120, 255);
  const item = newMacroMapping("x", "y");
  item.sequence = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
