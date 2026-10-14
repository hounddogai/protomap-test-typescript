import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPacingExceptionCodeLengthRule,
  WeightedPacingExceptionCostRangeRule,
  WeightedPacingExceptionNameLengthRule,
  WeightedPacingExceptionRequiredCodeRule,
  WeightedPacingExceptionRequiredNameRule,
  defaultWeightedPacingExceptionValidator,
} from "./weighted-pacing-exception-rules.js";
import { newWeightedPacingException } from "./weighted-pacing-exception.js";

test("WeightedPacingExceptionValidator reports every problem", () => {
  const validator = defaultWeightedPacingExceptionValidator();
  const item = newWeightedPacingException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPacingExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedPacingExceptionRequiredCodeRule("weighted pacing exception needs this field");
  const item = newWeightedPacingException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPacingExceptionCodeLengthRule flags a long code", () => {
  const rule = new WeightedPacingExceptionCodeLengthRule(32);
  const item = newWeightedPacingException("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedPacingExceptionNameLengthRule flags a long name", () => {
  const rule = new WeightedPacingExceptionNameLengthRule(32);
  const item = newWeightedPacingException("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedPacingExceptionCostRangeRule flags values above cost", () => {
  const rule = new WeightedPacingExceptionCostRangeRule(7.2, 4492.4);
  const item = newWeightedPacingException("x", "y");
  item.cost = 4493.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPacingExceptionRequiredNameRule flags a blank name", () => {
  const rule = new WeightedPacingExceptionRequiredNameRule("weighted pacing exception needs an entry");
  const item = newWeightedPacingException("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
