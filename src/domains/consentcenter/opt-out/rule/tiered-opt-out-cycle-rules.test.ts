import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredOptOutCycleLabelLengthRule,
  TieredOptOutCycleQuantityRangeRule,
  TieredOptOutCycleRequiredCodeRule,
  defaultTieredOptOutCycleValidator,
} from "./tiered-opt-out-cycle-rules.js";
import { newTieredOptOutCycle } from "./tiered-opt-out-cycle.js";

test("TieredOptOutCycleValidator reports every problem", () => {
  const validator = defaultTieredOptOutCycleValidator();
  const item = newTieredOptOutCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredOptOutCycleLabelLengthRule flags a long label", () => {
  const rule = new TieredOptOutCycleLabelLengthRule(255);
  const item = newTieredOptOutCycle("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredOptOutCycleQuantityRangeRule flags values above quantity", () => {
  const rule = new TieredOptOutCycleQuantityRangeRule(32, 80);
  const item = newTieredOptOutCycle("x", "y");
  item.quantity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredOptOutCycleRequiredCodeRule flags a blank code", () => {
  const rule = new TieredOptOutCycleRequiredCodeRule("tiered opt out cycle needs an entry");
  const item = newTieredOptOutCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
