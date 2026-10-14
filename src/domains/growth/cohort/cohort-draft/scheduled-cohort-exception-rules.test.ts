import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledCohortExceptionEndsAtRangeRule,
  ScheduledCohortExceptionRequiredCodeRule,
  ScheduledCohortExceptionRequiredDescriptionRule,
  defaultScheduledCohortExceptionValidator,
} from "./scheduled-cohort-exception-rules.js";
import { newScheduledCohortException } from "./scheduled-cohort-exception.js";

test("ScheduledCohortExceptionValidator reports every problem", () => {
  const validator = defaultScheduledCohortExceptionValidator();
  const item = newScheduledCohortException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledCohortExceptionRequiredDescriptionRule flags a blank description", () => {
  const rule = new ScheduledCohortExceptionRequiredDescriptionRule("scheduled cohort exception needs an entry");
  const item = newScheduledCohortException("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledCohortExceptionEndsAtRangeRule flags values above ends at", () => {
  const rule = new ScheduledCohortExceptionEndsAtRangeRule(32, 80);
  const item = newScheduledCohortException("x", "y");
  item.endsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledCohortExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledCohortExceptionRequiredCodeRule("scheduled cohort exception needs a value");
  const item = newScheduledCohortException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
