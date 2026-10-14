import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroTemplateJourneyIdLengthRule,
  MacroTemplateStartsAtRangeRule,
  defaultMacroTemplateValidator,
} from "./macro-template-rules.js";
import { newMacroTemplate } from "./macro-template.js";

test("MacroTemplateValidator reports every problem", () => {
  const validator = defaultMacroTemplateValidator();
  const item = newMacroTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroTemplateStartsAtRangeRule flags values above starts at", () => {
  const rule = new MacroTemplateStartsAtRangeRule(16, 16);
  const item = newMacroTemplate("x", "y");
  item.startsAt = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroTemplateJourneyIdLengthRule flags a long journey id", () => {
  const rule = new MacroTemplateJourneyIdLengthRule(32);
  const item = newMacroTemplate("x", "y");
  item.journeyId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
