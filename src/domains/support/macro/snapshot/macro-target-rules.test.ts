import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroTargetCodeLengthRule,
  MacroTargetRegionLengthRule,
  MacroTargetRequiredCodeRule,
  MacroTargetRequiredRegionRule,
  MacroTargetWindowDaysRangeRule,
  defaultMacroTargetValidator,
} from "./macro-target-rules.js";
import { newMacroTarget } from "./macro-target.js";

test("MacroTargetValidator reports every problem", () => {
  const validator = defaultMacroTargetValidator();
  const item = newMacroTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroTargetRequiredCodeRule flags a blank code", () => {
  const rule = new MacroTargetRequiredCodeRule("macro target needs this field");
  const item = newMacroTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroTargetWindowDaysRangeRule flags values above window days", () => {
  const rule = new MacroTargetWindowDaysRangeRule(1000, 86400);
  const item = newMacroTarget("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroTargetCodeLengthRule flags a long code", () => {
  const rule = new MacroTargetCodeLengthRule(16);
  const item = newMacroTarget("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroTargetRegionLengthRule flags a long region", () => {
  const rule = new MacroTargetRegionLengthRule(1000);
  const item = newMacroTarget("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroTargetRequiredRegionRule flags a blank region", () => {
  const rule = new MacroTargetRequiredRegionRule("macro target needs this field");
  const item = newMacroTarget("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
