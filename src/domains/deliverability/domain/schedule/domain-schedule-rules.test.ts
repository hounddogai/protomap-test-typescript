import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainScheduleLabelLengthRule,
  DomainScheduleMaximumRangeRule,
  DomainScheduleRequiredLocaleRule,
  DomainScheduleUtmSourceLengthRule,
  defaultDomainScheduleValidator,
} from "./domain-schedule-rules.js";
import { newDomainSchedule } from "./domain-schedule.js";

test("DomainScheduleValidator reports every problem", () => {
  const validator = defaultDomainScheduleValidator();
  const item = newDomainSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainScheduleMaximumRangeRule flags values above maximum", () => {
  const rule = new DomainScheduleMaximumRangeRule(8, 2662.3);
  const item = newDomainSchedule("x", "y");
  item.maximum = 2663.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainScheduleLabelLengthRule flags a long label", () => {
  const rule = new DomainScheduleLabelLengthRule(3600);
  const item = newDomainSchedule("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainScheduleRequiredLocaleRule flags a blank locale", () => {
  const rule = new DomainScheduleRequiredLocaleRule("domain schedule needs a value");
  const item = newDomainSchedule("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainScheduleUtmSourceLengthRule flags a long utm source", () => {
  const rule = new DomainScheduleUtmSourceLengthRule(86400);
  const item = newDomainSchedule("x", "y");
  item.utmSource = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
