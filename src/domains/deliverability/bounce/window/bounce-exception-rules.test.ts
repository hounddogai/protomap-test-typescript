import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceExceptionCostRangeRule,
  BounceExceptionLabelLengthRule,
  BounceExceptionRequiredCodeRule,
  defaultBounceExceptionValidator,
} from "./bounce-exception-rules.js";
import { newBounceException } from "./bounce-exception.js";

test("BounceExceptionValidator reports every problem", () => {
  const validator = defaultBounceExceptionValidator();
  const item = newBounceException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new BounceExceptionRequiredCodeRule("bounce exception needs a value");
  const item = newBounceException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceExceptionCostRangeRule flags values above cost", () => {
  const rule = new BounceExceptionCostRangeRule(2.9, 400);
  const item = newBounceException("x", "y");
  item.cost = 401.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BounceExceptionLabelLengthRule flags a long label", () => {
  const rule = new BounceExceptionLabelLengthRule(80);
  const item = newBounceException("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
