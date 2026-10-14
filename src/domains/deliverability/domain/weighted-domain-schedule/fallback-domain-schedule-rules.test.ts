import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackDomainScheduleCodeLengthRule,
  FallbackDomainScheduleLabelLengthRule,
  FallbackDomainScheduleLimitRangeRule,
  FallbackDomainScheduleRequiredCodeRule,
  FallbackDomainScheduleWeightRangeRule,
  defaultFallbackDomainScheduleValidator,
} from "./fallback-domain-schedule-rules.js";
import { newFallbackDomainSchedule } from "./fallback-domain-schedule.js";

test("FallbackDomainScheduleValidator reports every problem", () => {
  const validator = defaultFallbackDomainScheduleValidator();
  const item = newFallbackDomainSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackDomainScheduleLimitRangeRule flags values above limit", () => {
  const rule = new FallbackDomainScheduleLimitRangeRule(80, 255);
  const item = newFallbackDomainSchedule("x", "y");
  item.limit = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackDomainScheduleCodeLengthRule flags a long code", () => {
  const rule = new FallbackDomainScheduleCodeLengthRule(86400);
  const item = newFallbackDomainSchedule("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackDomainScheduleWeightRangeRule flags values above weight", () => {
  const rule = new FallbackDomainScheduleWeightRangeRule(6.9, 2963);
  const item = newFallbackDomainSchedule("x", "y");
  item.weight = 2964.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackDomainScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackDomainScheduleRequiredCodeRule("fallback domain schedule needs an entry");
  const item = newFallbackDomainSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackDomainScheduleLabelLengthRule flags a long label", () => {
  const rule = new FallbackDomainScheduleLabelLengthRule(86400);
  const item = newFallbackDomainSchedule("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
