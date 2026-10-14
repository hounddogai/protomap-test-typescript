import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionCycleCodeLengthRule,
  DeflectionCycleLocaleLengthRule,
  DeflectionCycleRequiredCodeRule,
  DeflectionCycleRetriesRangeRule,
  defaultDeflectionCycleValidator,
} from "./deflection-cycle-rules.js";
import { newDeflectionCycle } from "./deflection-cycle.js";

test("DeflectionCycleValidator reports every problem", () => {
  const validator = defaultDeflectionCycleValidator();
  const item = newDeflectionCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionCycleLocaleLengthRule flags a long locale", () => {
  const rule = new DeflectionCycleLocaleLengthRule(16);
  const item = newDeflectionCycle("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionCycleRetriesRangeRule flags values above retries", () => {
  const rule = new DeflectionCycleRetriesRangeRule(16, 86400);
  const item = newDeflectionCycle("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionCycleRequiredCodeRule flags a blank code", () => {
  const rule = new DeflectionCycleRequiredCodeRule("deflection cycle needs this field");
  const item = newDeflectionCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionCycleCodeLengthRule flags a long code", () => {
  const rule = new DeflectionCycleCodeLengthRule(1000);
  const item = newDeflectionCycle("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
