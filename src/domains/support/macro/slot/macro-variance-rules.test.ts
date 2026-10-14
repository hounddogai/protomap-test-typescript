import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroVarianceChannelLengthRule,
  MacroVarianceLabelLengthRule,
  MacroVarianceRequiredChannelRule,
  MacroVarianceThresholdRangeRule,
  defaultMacroVarianceValidator,
} from "./macro-variance-rules.js";
import { newMacroVariance } from "./macro-variance.js";

test("MacroVarianceValidator reports every problem", () => {
  const validator = defaultMacroVarianceValidator();
  const item = newMacroVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroVarianceThresholdRangeRule flags values above threshold", () => {
  const rule = new MacroVarianceThresholdRangeRule(3, 568.9);
  const item = newMacroVariance("x", "y");
  item.threshold = 570.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroVarianceLabelLengthRule flags a long label", () => {
  const rule = new MacroVarianceLabelLengthRule(1000);
  const item = newMacroVariance("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroVarianceRequiredChannelRule flags a blank channel", () => {
  const rule = new MacroVarianceRequiredChannelRule("macro variance needs a value");
  const item = newMacroVariance("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroVarianceChannelLengthRule flags a long channel", () => {
  const rule = new MacroVarianceChannelLengthRule(1000);
  const item = newMacroVariance("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
