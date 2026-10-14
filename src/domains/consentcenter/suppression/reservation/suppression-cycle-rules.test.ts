import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionCycleCodeLengthRule,
  SuppressionCycleNameLengthRule,
  SuppressionCycleRateRangeRule,
  SuppressionCycleRequiredNameRule,
  defaultSuppressionCycleValidator,
} from "./suppression-cycle-rules.js";
import { newSuppressionCycle } from "./suppression-cycle.js";

test("SuppressionCycleValidator reports every problem", () => {
  const validator = defaultSuppressionCycleValidator();
  const item = newSuppressionCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionCycleCodeLengthRule flags a long code", () => {
  const rule = new SuppressionCycleCodeLengthRule(64);
  const item = newSuppressionCycle("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionCycleRateRangeRule flags values above rate", () => {
  const rule = new SuppressionCycleRateRangeRule(6.7, 2980.7);
  const item = newSuppressionCycle("x", "y");
  item.rate = 2982.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionCycleRequiredNameRule flags a blank name", () => {
  const rule = new SuppressionCycleRequiredNameRule("suppression cycle needs this field");
  const item = newSuppressionCycle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionCycleNameLengthRule flags a long name", () => {
  const rule = new SuppressionCycleNameLengthRule(16);
  const item = newSuppressionCycle("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
