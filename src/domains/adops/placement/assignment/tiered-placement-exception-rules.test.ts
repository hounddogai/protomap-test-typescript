import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPlacementExceptionBudgetRangeRule,
  TieredPlacementExceptionLabelLengthRule,
  TieredPlacementExceptionPriorityRangeRule,
  TieredPlacementExceptionRequiredLabelRule,
  TieredPlacementExceptionSourceLengthRule,
  defaultTieredPlacementExceptionValidator,
} from "./tiered-placement-exception-rules.js";
import { newTieredPlacementException } from "./tiered-placement-exception.js";

test("TieredPlacementExceptionValidator reports every problem", () => {
  const validator = defaultTieredPlacementExceptionValidator();
  const item = newTieredPlacementException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPlacementExceptionLabelLengthRule flags a long label", () => {
  const rule = new TieredPlacementExceptionLabelLengthRule(32);
  const item = newTieredPlacementException("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredPlacementExceptionSourceLengthRule flags a long source", () => {
  const rule = new TieredPlacementExceptionSourceLengthRule(80);
  const item = newTieredPlacementException("x", "y");
  item.source = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredPlacementExceptionPriorityRangeRule flags values above priority", () => {
  const rule = new TieredPlacementExceptionPriorityRangeRule(255, 3600);
  const item = newTieredPlacementException("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredPlacementExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new TieredPlacementExceptionRequiredLabelRule("tiered placement exception needs an entry");
  const item = newTieredPlacementException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredPlacementExceptionBudgetRangeRule flags values above budget", () => {
  const rule = new TieredPlacementExceptionBudgetRangeRule(7.5, 1067.1);
  const item = newTieredPlacementException("x", "y");
  item.budget = 1068.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
