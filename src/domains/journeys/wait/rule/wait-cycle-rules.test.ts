import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitCycleCodeLengthRule,
  WaitCycleCreatedAtRangeRule,
  WaitCycleJourneyIdLengthRule,
  WaitCycleMaximumRangeRule,
  WaitCycleRequiredNameRule,
  WaitCycleRequiredTitleRule,
  defaultWaitCycleValidator,
} from "./wait-cycle-rules.js";
import { newWaitCycle } from "./wait-cycle.js";

test("WaitCycleValidator reports every problem", () => {
  const validator = defaultWaitCycleValidator();
  const item = newWaitCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitCycleCodeLengthRule flags a long code", () => {
  const rule = new WaitCycleCodeLengthRule(16);
  const item = newWaitCycle("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitCycleRequiredNameRule flags a blank name", () => {
  const rule = new WaitCycleRequiredNameRule("wait cycle needs this field");
  const item = newWaitCycle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitCycleCreatedAtRangeRule flags values above created at", () => {
  const rule = new WaitCycleCreatedAtRangeRule(16, 80);
  const item = newWaitCycle("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitCycleRequiredTitleRule flags a blank title", () => {
  const rule = new WaitCycleRequiredTitleRule("wait cycle needs a value");
  const item = newWaitCycle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitCycleMaximumRangeRule flags values above maximum", () => {
  const rule = new WaitCycleMaximumRangeRule(4.7, 175.6);
  const item = newWaitCycle("x", "y");
  item.maximum = 177.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitCycleJourneyIdLengthRule flags a long journey id", () => {
  const rule = new WaitCycleJourneyIdLengthRule(120);
  const item = newWaitCycle("x", "y");
  item.journeyId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
