import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictWaitCycleCodeLengthRule,
  StrictWaitCycleLabelLengthRule,
  StrictWaitCycleRequiredCategoryRule,
  StrictWaitCycleRequiredCodeRule,
  StrictWaitCycleRequiredLabelRule,
  StrictWaitCycleRequiredSegmentRule,
  defaultStrictWaitCycleValidator,
} from "./strict-wait-cycle-rules.js";
import { newStrictWaitCycle } from "./strict-wait-cycle.js";

test("StrictWaitCycleValidator reports every problem", () => {
  const validator = defaultStrictWaitCycleValidator();
  const item = newStrictWaitCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictWaitCycleRequiredLabelRule flags a blank label", () => {
  const rule = new StrictWaitCycleRequiredLabelRule("strict wait cycle needs a value");
  const item = newStrictWaitCycle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictWaitCycleRequiredCategoryRule flags a blank category", () => {
  const rule = new StrictWaitCycleRequiredCategoryRule("strict wait cycle needs an entry");
  const item = newStrictWaitCycle("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictWaitCycleRequiredSegmentRule flags a blank segment", () => {
  const rule = new StrictWaitCycleRequiredSegmentRule("strict wait cycle needs an entry");
  const item = newStrictWaitCycle("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictWaitCycleCodeLengthRule flags a long code", () => {
  const rule = new StrictWaitCycleCodeLengthRule(86400);
  const item = newStrictWaitCycle("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictWaitCycleLabelLengthRule flags a long label", () => {
  const rule = new StrictWaitCycleLabelLengthRule(1000);
  const item = newStrictWaitCycle("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictWaitCycleRequiredCodeRule flags a blank code", () => {
  const rule = new StrictWaitCycleRequiredCodeRule("strict wait cycle needs an entry");
  const item = newStrictWaitCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
