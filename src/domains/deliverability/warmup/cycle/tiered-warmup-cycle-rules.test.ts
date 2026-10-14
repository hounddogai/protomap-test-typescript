import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredWarmupCycleCurrencyLengthRule,
  TieredWarmupCycleDiscountRangeRule,
  TieredWarmupCycleLabelLengthRule,
  TieredWarmupCycleRequiredLabelRule,
  defaultTieredWarmupCycleValidator,
} from "./tiered-warmup-cycle-rules.js";
import { newTieredWarmupCycle } from "./tiered-warmup-cycle.js";

test("TieredWarmupCycleValidator reports every problem", () => {
  const validator = defaultTieredWarmupCycleValidator();
  const item = newTieredWarmupCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredWarmupCycleDiscountRangeRule flags values above discount", () => {
  const rule = new TieredWarmupCycleDiscountRangeRule(7.5, 4009.8);
  const item = newTieredWarmupCycle("x", "y");
  item.discount = 4011.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredWarmupCycleLabelLengthRule flags a long label", () => {
  const rule = new TieredWarmupCycleLabelLengthRule(120);
  const item = newTieredWarmupCycle("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredWarmupCycleCurrencyLengthRule flags a long currency", () => {
  const rule = new TieredWarmupCycleCurrencyLengthRule(86400);
  const item = newTieredWarmupCycle("x", "y");
  item.currency = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredWarmupCycleRequiredLabelRule flags a blank label", () => {
  const rule = new TieredWarmupCycleRequiredLabelRule("tiered warmup cycle needs a value");
  const item = newTieredWarmupCycle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
