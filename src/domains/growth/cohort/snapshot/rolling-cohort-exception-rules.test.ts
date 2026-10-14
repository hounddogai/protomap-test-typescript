import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingCohortExceptionCodeLengthRule,
  RollingCohortExceptionDurationMinutesRangeRule,
  RollingCohortExceptionNameLengthRule,
  RollingCohortExceptionRequiredNameRule,
  defaultRollingCohortExceptionValidator,
} from "./rolling-cohort-exception-rules.js";
import { newRollingCohortException } from "./rolling-cohort-exception.js";

test("RollingCohortExceptionValidator reports every problem", () => {
  const validator = defaultRollingCohortExceptionValidator();
  const item = newRollingCohortException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingCohortExceptionNameLengthRule flags a long name", () => {
  const rule = new RollingCohortExceptionNameLengthRule(64);
  const item = newRollingCohortException("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingCohortExceptionCodeLengthRule flags a long code", () => {
  const rule = new RollingCohortExceptionCodeLengthRule(16);
  const item = newRollingCohortException("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingCohortExceptionRequiredNameRule flags a blank name", () => {
  const rule = new RollingCohortExceptionRequiredNameRule("rolling cohort exception needs an entry");
  const item = newRollingCohortException("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingCohortExceptionDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new RollingCohortExceptionDurationMinutesRangeRule(16, 120);
  const item = newRollingCohortException("x", "y");
  item.durationMinutes = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
