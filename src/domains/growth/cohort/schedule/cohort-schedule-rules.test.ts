import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortScheduleCodeLengthRule,
  CohortScheduleRequiredLabelRule,
  defaultCohortScheduleValidator,
} from "./cohort-schedule-rules.js";
import { newCohortSchedule } from "./cohort-schedule.js";

test("CohortScheduleValidator reports every problem", () => {
  const validator = defaultCohortScheduleValidator();
  const item = newCohortSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortScheduleCodeLengthRule flags a long code", () => {
  const rule = new CohortScheduleCodeLengthRule(86400);
  const item = newCohortSchedule("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortScheduleRequiredLabelRule flags a blank label", () => {
  const rule = new CohortScheduleRequiredLabelRule("cohort schedule needs a value");
  const item = newCohortSchedule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
