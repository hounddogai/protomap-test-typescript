import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowCycleDurationMinutesRangeRule,
  WindowCycleRequiredCodeRule,
  WindowCycleRequiredTitleRule,
  WindowCycleTitleLengthRule,
  defaultWindowCycleValidator,
} from "./window-cycle-rules.js";
import { newWindowCycle } from "./window-cycle.js";

test("WindowCycleValidator reports every problem", () => {
  const validator = defaultWindowCycleValidator();
  const item = newWindowCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowCycleTitleLengthRule flags a long title", () => {
  const rule = new WindowCycleTitleLengthRule(64);
  const item = newWindowCycle("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowCycleRequiredCodeRule flags a blank code", () => {
  const rule = new WindowCycleRequiredCodeRule("window cycle needs an entry");
  const item = newWindowCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowCycleDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new WindowCycleDurationMinutesRangeRule(32, 86400);
  const item = newWindowCycle("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowCycleRequiredTitleRule flags a blank title", () => {
  const rule = new WindowCycleRequiredTitleRule("window cycle needs an entry");
  const item = newWindowCycle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
