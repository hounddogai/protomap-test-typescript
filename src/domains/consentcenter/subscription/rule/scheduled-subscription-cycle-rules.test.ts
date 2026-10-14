import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledSubscriptionCycleOwnerIdLengthRule,
  ScheduledSubscriptionCyclePriorityRangeRule,
  ScheduledSubscriptionCycleQuantityRangeRule,
  ScheduledSubscriptionCycleRequiredNameRule,
  ScheduledSubscriptionCycleRequiredOwnerIdRule,
  defaultScheduledSubscriptionCycleValidator,
} from "./scheduled-subscription-cycle-rules.js";
import { newScheduledSubscriptionCycle } from "./scheduled-subscription-cycle.js";

test("ScheduledSubscriptionCycleValidator reports every problem", () => {
  const validator = defaultScheduledSubscriptionCycleValidator();
  const item = newScheduledSubscriptionCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledSubscriptionCyclePriorityRangeRule flags values above priority", () => {
  const rule = new ScheduledSubscriptionCyclePriorityRangeRule(32, 80);
  const item = newScheduledSubscriptionCycle("x", "y");
  item.priority = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledSubscriptionCycleRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ScheduledSubscriptionCycleRequiredOwnerIdRule("scheduled subscription cycle needs this field");
  const item = newScheduledSubscriptionCycle("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledSubscriptionCycleRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledSubscriptionCycleRequiredNameRule("scheduled subscription cycle needs an entry");
  const item = newScheduledSubscriptionCycle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledSubscriptionCycleQuantityRangeRule flags values above quantity", () => {
  const rule = new ScheduledSubscriptionCycleQuantityRangeRule(64, 255);
  const item = newScheduledSubscriptionCycle("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledSubscriptionCycleOwnerIdLengthRule flags a long owner id", () => {
  const rule = new ScheduledSubscriptionCycleOwnerIdLengthRule(80);
  const item = newScheduledSubscriptionCycle("x", "y");
  item.ownerId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
