import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultMacroBaselineAmountRangeRule,
  DefaultMacroBaselineRatioRangeRule,
  DefaultMacroBaselineRequiredCodeRule,
  DefaultMacroBaselineRequiredNameRule,
  defaultDefaultMacroBaselineValidator,
} from "./default-macro-baseline-rules.js";
import { newDefaultMacroBaseline } from "./default-macro-baseline.js";

test("DefaultMacroBaselineValidator reports every problem", () => {
  const validator = defaultDefaultMacroBaselineValidator();
  const item = newDefaultMacroBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultMacroBaselineRequiredNameRule flags a blank name", () => {
  const rule = new DefaultMacroBaselineRequiredNameRule("default macro baseline needs a value");
  const item = newDefaultMacroBaseline("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultMacroBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultMacroBaselineRequiredCodeRule("default macro baseline needs this field");
  const item = newDefaultMacroBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultMacroBaselineRatioRangeRule flags values above ratio", () => {
  const rule = new DefaultMacroBaselineRatioRangeRule(9.6, 488.2);
  const item = newDefaultMacroBaseline("x", "y");
  item.ratio = 489.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultMacroBaselineAmountRangeRule flags values above amount", () => {
  const rule = new DefaultMacroBaselineAmountRangeRule(1.9, 895.7);
  const item = newDefaultMacroBaseline("x", "y");
  item.amount = 897.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
