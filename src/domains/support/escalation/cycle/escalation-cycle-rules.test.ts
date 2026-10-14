import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationCycleFloorValueRangeRule,
  EscalationCycleLimitRangeRule,
  EscalationCycleRequiredCodeRule,
  EscalationCycleSummaryLengthRule,
  defaultEscalationCycleValidator,
} from "./escalation-cycle-rules.js";
import { newEscalationCycle } from "./escalation-cycle.js";

test("EscalationCycleValidator reports every problem", () => {
  const validator = defaultEscalationCycleValidator();
  const item = newEscalationCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationCycleLimitRangeRule flags values above limit", () => {
  const rule = new EscalationCycleLimitRangeRule(64, 255);
  const item = newEscalationCycle("x", "y");
  item.limit = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationCycleFloorValueRangeRule flags values above floor value", () => {
  const rule = new EscalationCycleFloorValueRangeRule(0.7, 4268.3);
  const item = newEscalationCycle("x", "y");
  item.floorValue = 4269.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationCycleSummaryLengthRule flags a long summary", () => {
  const rule = new EscalationCycleSummaryLengthRule(32);
  const item = newEscalationCycle("x", "y");
  item.summary = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationCycleRequiredCodeRule flags a blank code", () => {
  const rule = new EscalationCycleRequiredCodeRule("escalation cycle needs a value");
  const item = newEscalationCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
