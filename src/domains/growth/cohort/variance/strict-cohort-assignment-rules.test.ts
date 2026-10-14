import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictCohortAssignmentContactEmailLengthRule,
  StrictCohortAssignmentRequiredNameRule,
  defaultStrictCohortAssignmentValidator,
} from "./strict-cohort-assignment-rules.js";
import { newStrictCohortAssignment } from "./strict-cohort-assignment.js";

test("StrictCohortAssignmentValidator reports every problem", () => {
  const validator = defaultStrictCohortAssignmentValidator();
  const item = newStrictCohortAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictCohortAssignmentContactEmailLengthRule flags a long contact email", () => {
  const rule = new StrictCohortAssignmentContactEmailLengthRule(3600);
  const item = newStrictCohortAssignment("x", "y");
  item.contactEmail = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictCohortAssignmentRequiredNameRule flags a blank name", () => {
  const rule = new StrictCohortAssignmentRequiredNameRule("strict cohort assignment needs an entry");
  const item = newStrictCohortAssignment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
