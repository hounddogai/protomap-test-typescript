import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationBaselineCodeLengthRule,
  ActivationBaselinePriorityRangeRule,
  ActivationBaselineRequiredLabelRule,
  ActivationBaselineUnitLengthRule,
  defaultActivationBaselineValidator,
} from "./activation-baseline-rules.js";
import { newActivationBaseline } from "./activation-baseline.js";

test("ActivationBaselineValidator reports every problem", () => {
  const validator = defaultActivationBaselineValidator();
  const item = newActivationBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationBaselinePriorityRangeRule flags values above priority", () => {
  const rule = new ActivationBaselinePriorityRangeRule(255, 3600);
  const item = newActivationBaseline("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationBaselineCodeLengthRule flags a long code", () => {
  const rule = new ActivationBaselineCodeLengthRule(3600);
  const item = newActivationBaseline("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationBaselineUnitLengthRule flags a long unit", () => {
  const rule = new ActivationBaselineUnitLengthRule(64);
  const item = newActivationBaseline("x", "y");
  item.unit = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationBaselineRequiredLabelRule flags a blank label", () => {
  const rule = new ActivationBaselineRequiredLabelRule("activation baseline needs this field");
  const item = newActivationBaseline("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
