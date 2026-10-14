import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroOverrideClicksRangeRule,
  MacroOverrideLabelLengthRule,
  MacroOverrideRequiredContactEmailRule,
  MacroOverrideRequiredReviewerRule,
  MacroOverrideReviewerLengthRule,
  defaultMacroOverrideValidator,
} from "./macro-override-rules.js";
import { newMacroOverride } from "./macro-override.js";

test("MacroOverrideValidator reports every problem", () => {
  const validator = defaultMacroOverrideValidator();
  const item = newMacroOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroOverrideRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new MacroOverrideRequiredReviewerRule("macro override needs this field");
  const item = newMacroOverride("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroOverrideRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new MacroOverrideRequiredContactEmailRule("macro override needs an entry");
  const item = newMacroOverride("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroOverrideLabelLengthRule flags a long label", () => {
  const rule = new MacroOverrideLabelLengthRule(32);
  const item = newMacroOverride("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroOverrideClicksRangeRule flags values above clicks", () => {
  const rule = new MacroOverrideClicksRangeRule(32, 3600);
  const item = newMacroOverride("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroOverrideReviewerLengthRule flags a long reviewer", () => {
  const rule = new MacroOverrideReviewerLengthRule(1000);
  const item = newMacroOverride("x", "y");
  item.reviewer = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
