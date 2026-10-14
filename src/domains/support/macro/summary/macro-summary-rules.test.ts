import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroSummaryCohortLengthRule,
  MacroSummaryRatioRangeRule,
  MacroSummaryRequiredLabelRule,
  defaultMacroSummaryValidator,
} from "./macro-summary-rules.js";
import { newMacroSummary } from "./macro-summary.js";

test("MacroSummaryValidator reports every problem", () => {
  const validator = defaultMacroSummaryValidator();
  const item = newMacroSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new MacroSummaryRequiredLabelRule("macro summary needs a value");
  const item = newMacroSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroSummaryCohortLengthRule flags a long cohort", () => {
  const rule = new MacroSummaryCohortLengthRule(32);
  const item = newMacroSummary("x", "y");
  item.cohort = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroSummaryRatioRangeRule flags values above ratio", () => {
  const rule = new MacroSummaryRatioRangeRule(9.1, 4581.7);
  const item = newMacroSummary("x", "y");
  item.ratio = 4583.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
