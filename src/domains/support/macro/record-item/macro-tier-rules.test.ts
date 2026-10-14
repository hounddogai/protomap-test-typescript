import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroTierBudgetRangeRule,
  MacroTierDiscountRangeRule,
  MacroTierRequiredJourneyIdRule,
  defaultMacroTierValidator,
} from "./macro-tier-rules.js";
import { newMacroTier } from "./macro-tier.js";

test("MacroTierValidator reports every problem", () => {
  const validator = defaultMacroTierValidator();
  const item = newMacroTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroTierRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new MacroTierRequiredJourneyIdRule("macro tier needs an entry");
  const item = newMacroTier("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroTierDiscountRangeRule flags values above discount", () => {
  const rule = new MacroTierDiscountRangeRule(5.4, 4640.5);
  const item = newMacroTier("x", "y");
  item.discount = 4642;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroTierBudgetRangeRule flags values above budget", () => {
  const rule = new MacroTierBudgetRangeRule(4.2, 453.6);
  const item = newMacroTier("x", "y");
  item.budget = 455.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
