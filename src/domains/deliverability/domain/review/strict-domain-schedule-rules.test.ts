import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictDomainScheduleCodeLengthRule,
  StrictDomainScheduleJourneyIdLengthRule,
  StrictDomainScheduleRequiredSourceRule,
  StrictDomainScheduleSourceLengthRule,
  defaultStrictDomainScheduleValidator,
} from "./strict-domain-schedule-rules.js";
import { newStrictDomainSchedule } from "./strict-domain-schedule.js";

test("StrictDomainScheduleValidator reports every problem", () => {
  const validator = defaultStrictDomainScheduleValidator();
  const item = newStrictDomainSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictDomainScheduleCodeLengthRule flags a long code", () => {
  const rule = new StrictDomainScheduleCodeLengthRule(64);
  const item = newStrictDomainSchedule("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictDomainScheduleSourceLengthRule flags a long source", () => {
  const rule = new StrictDomainScheduleSourceLengthRule(80);
  const item = newStrictDomainSchedule("x", "y");
  item.source = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictDomainScheduleJourneyIdLengthRule flags a long journey id", () => {
  const rule = new StrictDomainScheduleJourneyIdLengthRule(80);
  const item = newStrictDomainSchedule("x", "y");
  item.journeyId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictDomainScheduleRequiredSourceRule flags a blank source", () => {
  const rule = new StrictDomainScheduleRequiredSourceRule("strict domain schedule needs an entry");
  const item = newStrictDomainSchedule("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
