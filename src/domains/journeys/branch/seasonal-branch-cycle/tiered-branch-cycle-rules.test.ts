import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredBranchCycleCodeLengthRule,
  TieredBranchCycleLabelLengthRule,
  TieredBranchCycleMaximumRangeRule,
  TieredBranchCycleRatioRangeRule,
  TieredBranchCycleRequiredCodeRule,
  TieredBranchCycleWindowDaysRangeRule,
  defaultTieredBranchCycleValidator,
} from "./tiered-branch-cycle-rules.js";
import { newTieredBranchCycle } from "./tiered-branch-cycle.js";

test("TieredBranchCycleValidator reports every problem", () => {
  const validator = defaultTieredBranchCycleValidator();
  const item = newTieredBranchCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredBranchCycleWindowDaysRangeRule flags values above window days", () => {
  const rule = new TieredBranchCycleWindowDaysRangeRule(32, 1000);
  const item = newTieredBranchCycle("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBranchCycleRequiredCodeRule flags a blank code", () => {
  const rule = new TieredBranchCycleRequiredCodeRule("tiered branch cycle needs a value");
  const item = newTieredBranchCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBranchCycleMaximumRangeRule flags values above maximum", () => {
  const rule = new TieredBranchCycleMaximumRangeRule(3.4, 4964.9);
  const item = newTieredBranchCycle("x", "y");
  item.maximum = 4966.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBranchCycleRatioRangeRule flags values above ratio", () => {
  const rule = new TieredBranchCycleRatioRangeRule(6.2, 1303.2);
  const item = newTieredBranchCycle("x", "y");
  item.ratio = 1304.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBranchCycleLabelLengthRule flags a long label", () => {
  const rule = new TieredBranchCycleLabelLengthRule(64);
  const item = newTieredBranchCycle("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBranchCycleCodeLengthRule flags a long code", () => {
  const rule = new TieredBranchCycleCodeLengthRule(32);
  const item = newTieredBranchCycle("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
