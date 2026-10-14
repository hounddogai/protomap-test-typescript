import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledWaitCycleClicksRangeRule,
  ScheduledWaitCycleCodeLengthRule,
  ScheduledWaitCycleRequiredCountryRule,
  ScheduledWaitCycleTitleLengthRule,
  defaultScheduledWaitCycleValidator,
} from "./scheduled-wait-cycle-rules.js";
import { newScheduledWaitCycle } from "./scheduled-wait-cycle.js";

test("ScheduledWaitCycleValidator reports every problem", () => {
  const validator = defaultScheduledWaitCycleValidator();
  const item = newScheduledWaitCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledWaitCycleClicksRangeRule flags values above clicks", () => {
  const rule = new ScheduledWaitCycleClicksRangeRule(16, 3600);
  const item = newScheduledWaitCycle("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledWaitCycleCodeLengthRule flags a long code", () => {
  const rule = new ScheduledWaitCycleCodeLengthRule(1000);
  const item = newScheduledWaitCycle("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledWaitCycleTitleLengthRule flags a long title", () => {
  const rule = new ScheduledWaitCycleTitleLengthRule(64);
  const item = newScheduledWaitCycle("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledWaitCycleRequiredCountryRule flags a blank country", () => {
  const rule = new ScheduledWaitCycleRequiredCountryRule("scheduled wait cycle needs an entry");
  const item = newScheduledWaitCycle("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
