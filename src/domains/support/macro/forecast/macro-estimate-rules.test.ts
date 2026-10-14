import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroEstimateRequiredOwnerIdRule,
  MacroEstimateRequiredTitleRule,
  MacroEstimateThresholdRangeRule,
  MacroEstimateTitleLengthRule,
  defaultMacroEstimateValidator,
} from "./macro-estimate-rules.js";
import { newMacroEstimate } from "./macro-estimate.js";

test("MacroEstimateValidator reports every problem", () => {
  const validator = defaultMacroEstimateValidator();
  const item = newMacroEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroEstimateTitleLengthRule flags a long title", () => {
  const rule = new MacroEstimateTitleLengthRule(86400);
  const item = newMacroEstimate("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroEstimateRequiredTitleRule flags a blank title", () => {
  const rule = new MacroEstimateRequiredTitleRule("macro estimate needs a value");
  const item = newMacroEstimate("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroEstimateThresholdRangeRule flags values above threshold", () => {
  const rule = new MacroEstimateThresholdRangeRule(7.2, 966.7);
  const item = newMacroEstimate("x", "y");
  item.threshold = 968.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroEstimateRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new MacroEstimateRequiredOwnerIdRule("macro estimate needs this field");
  const item = newMacroEstimate("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
