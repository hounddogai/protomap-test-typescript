import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingSlaBaselineCapacityRangeRule,
  RollingSlaBaselineNameLengthRule,
  RollingSlaBaselineRequiredCodeRule,
  RollingSlaBaselineRequiredTitleRule,
  defaultRollingSlaBaselineValidator,
} from "./rolling-sla-baseline-rules.js";
import { newRollingSlaBaseline } from "./rolling-sla-baseline.js";

test("RollingSlaBaselineValidator reports every problem", () => {
  const validator = defaultRollingSlaBaselineValidator();
  const item = newRollingSlaBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingSlaBaselineCapacityRangeRule flags values above capacity", () => {
  const rule = new RollingSlaBaselineCapacityRangeRule(120, 255);
  const item = newRollingSlaBaseline("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingSlaBaselineRequiredTitleRule flags a blank title", () => {
  const rule = new RollingSlaBaselineRequiredTitleRule("rolling sla baseline needs this field");
  const item = newRollingSlaBaseline("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingSlaBaselineNameLengthRule flags a long name", () => {
  const rule = new RollingSlaBaselineNameLengthRule(80);
  const item = newRollingSlaBaseline("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingSlaBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new RollingSlaBaselineRequiredCodeRule("rolling sla baseline needs this field");
  const item = newRollingSlaBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
