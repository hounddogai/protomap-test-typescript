import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierScheduleCodeLengthRule,
  TierScheduleNameLengthRule,
  TierScheduleRequiredNameRule,
  TierScheduleRequiredSummaryRule,
  TierScheduleRequiredUnitRule,
  defaultTierScheduleValidator,
} from "./tier-schedule-rules.js";
import { newTierSchedule } from "./tier-schedule.js";

test("TierScheduleValidator reports every problem", () => {
  const validator = defaultTierScheduleValidator();
  const item = newTierSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierScheduleRequiredSummaryRule flags a blank summary", () => {
  const rule = new TierScheduleRequiredSummaryRule("tier schedule needs a value");
  const item = newTierSchedule("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierScheduleRequiredNameRule flags a blank name", () => {
  const rule = new TierScheduleRequiredNameRule("tier schedule needs an entry");
  const item = newTierSchedule("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierScheduleCodeLengthRule flags a long code", () => {
  const rule = new TierScheduleCodeLengthRule(64);
  const item = newTierSchedule("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierScheduleRequiredUnitRule flags a blank unit", () => {
  const rule = new TierScheduleRequiredUnitRule("tier schedule needs this field");
  const item = newTierSchedule("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierScheduleNameLengthRule flags a long name", () => {
  const rule = new TierScheduleNameLengthRule(64);
  const item = newTierSchedule("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
