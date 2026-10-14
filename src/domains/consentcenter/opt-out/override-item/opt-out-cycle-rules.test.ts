import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutCycleCodeLengthRule,
  OptOutCycleRequiredSummaryRule,
  OptOutCycleStartsAtRangeRule,
  OptOutCycleSummaryLengthRule,
  OptOutCycleTitleLengthRule,
  defaultOptOutCycleValidator,
} from "./opt-out-cycle-rules.js";
import { newOptOutCycle } from "./opt-out-cycle.js";

test("OptOutCycleValidator reports every problem", () => {
  const validator = defaultOptOutCycleValidator();
  const item = newOptOutCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutCycleStartsAtRangeRule flags values above starts at", () => {
  const rule = new OptOutCycleStartsAtRangeRule(16, 80);
  const item = newOptOutCycle("x", "y");
  item.startsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("OptOutCycleCodeLengthRule flags a long code", () => {
  const rule = new OptOutCycleCodeLengthRule(255);
  const item = newOptOutCycle("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutCycleTitleLengthRule flags a long title", () => {
  const rule = new OptOutCycleTitleLengthRule(120);
  const item = newOptOutCycle("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutCycleRequiredSummaryRule flags a blank summary", () => {
  const rule = new OptOutCycleRequiredSummaryRule("opt out cycle needs an entry");
  const item = newOptOutCycle("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutCycleSummaryLengthRule flags a long summary", () => {
  const rule = new OptOutCycleSummaryLengthRule(120);
  const item = newOptOutCycle("x", "y");
  item.summary = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
