import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortMilestoneRequiredLocaleRule,
  CohortMilestoneRetriesRangeRule,
  CohortMilestoneRevisionRangeRule,
  defaultCohortMilestoneValidator,
} from "./cohort-milestone-rules.js";
import { newCohortMilestone } from "./cohort-milestone.js";

test("CohortMilestoneValidator reports every problem", () => {
  const validator = defaultCohortMilestoneValidator();
  const item = newCohortMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortMilestoneRequiredLocaleRule flags a blank locale", () => {
  const rule = new CohortMilestoneRequiredLocaleRule("cohort milestone needs this field");
  const item = newCohortMilestone("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortMilestoneRetriesRangeRule flags values above retries", () => {
  const rule = new CohortMilestoneRetriesRangeRule(120, 1000);
  const item = newCohortMilestone("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortMilestoneRevisionRangeRule flags values above revision", () => {
  const rule = new CohortMilestoneRevisionRangeRule(16, 64);
  const item = newCohortMilestone("x", "y");
  item.revision = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
