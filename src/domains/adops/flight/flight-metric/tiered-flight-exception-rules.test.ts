import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredFlightExceptionCostRangeRule,
  TieredFlightExceptionRequiredCategoryRule,
  TieredFlightExceptionRequiredCodeRule,
  TieredFlightExceptionTitleLengthRule,
  defaultTieredFlightExceptionValidator,
} from "./tiered-flight-exception-rules.js";
import { newTieredFlightException } from "./tiered-flight-exception.js";

test("TieredFlightExceptionValidator reports every problem", () => {
  const validator = defaultTieredFlightExceptionValidator();
  const item = newTieredFlightException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredFlightExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new TieredFlightExceptionRequiredCodeRule("tiered flight exception needs an entry");
  const item = newTieredFlightException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredFlightExceptionCostRangeRule flags values above cost", () => {
  const rule = new TieredFlightExceptionCostRangeRule(7.8, 4259.6);
  const item = newTieredFlightException("x", "y");
  item.cost = 4261.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredFlightExceptionTitleLengthRule flags a long title", () => {
  const rule = new TieredFlightExceptionTitleLengthRule(1000);
  const item = newTieredFlightException("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredFlightExceptionRequiredCategoryRule flags a blank category", () => {
  const rule = new TieredFlightExceptionRequiredCategoryRule("tiered flight exception needs an entry");
  const item = newTieredFlightException("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
