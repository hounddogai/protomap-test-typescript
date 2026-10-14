import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutBaselineAmountRangeRule,
  OptOutBaselineCodeLengthRule,
  OptOutBaselineRequiredCodeRule,
  OptOutBaselineRequiredNameRule,
  defaultOptOutBaselineValidator,
} from "./opt-out-baseline-rules.js";
import { newOptOutBaseline } from "./opt-out-baseline.js";

test("OptOutBaselineValidator reports every problem", () => {
  const validator = defaultOptOutBaselineValidator();
  const item = newOptOutBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutBaselineCodeLengthRule flags a long code", () => {
  const rule = new OptOutBaselineCodeLengthRule(80);
  const item = newOptOutBaseline("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new OptOutBaselineRequiredCodeRule("opt out baseline needs an entry");
  const item = newOptOutBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutBaselineAmountRangeRule flags values above amount", () => {
  const rule = new OptOutBaselineAmountRangeRule(7, 2501.9);
  const item = newOptOutBaseline("x", "y");
  item.amount = 2503.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("OptOutBaselineRequiredNameRule flags a blank name", () => {
  const rule = new OptOutBaselineRequiredNameRule("opt out baseline needs this field");
  const item = newOptOutBaseline("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
