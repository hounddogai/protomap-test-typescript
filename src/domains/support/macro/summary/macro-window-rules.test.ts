import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroWindowBidRangeRule,
  MacroWindowJourneyIdLengthRule,
  MacroWindowRequiredLabelRule,
  defaultMacroWindowValidator,
} from "./macro-window-rules.js";
import { newMacroWindow } from "./macro-window.js";

test("MacroWindowValidator reports every problem", () => {
  const validator = defaultMacroWindowValidator();
  const item = newMacroWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroWindowRequiredLabelRule flags a blank label", () => {
  const rule = new MacroWindowRequiredLabelRule("macro window needs an entry");
  const item = newMacroWindow("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroWindowBidRangeRule flags values above bid", () => {
  const rule = new MacroWindowBidRangeRule(2.7, 2009.2);
  const item = newMacroWindow("x", "y");
  item.bid = 2010.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroWindowJourneyIdLengthRule flags a long journey id", () => {
  const rule = new MacroWindowJourneyIdLengthRule(32);
  const item = newMacroWindow("x", "y");
  item.journeyId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
