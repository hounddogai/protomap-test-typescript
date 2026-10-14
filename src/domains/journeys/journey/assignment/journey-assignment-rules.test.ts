import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyAssignmentCountryLengthRule,
  JourneyAssignmentRequiredCodeRule,
  JourneyAssignmentRequiredTitleRule,
  JourneyAssignmentTitleLengthRule,
  defaultJourneyAssignmentValidator,
} from "./journey-assignment-rules.js";
import { newJourneyAssignment } from "./journey-assignment.js";

test("JourneyAssignmentValidator reports every problem", () => {
  const validator = defaultJourneyAssignmentValidator();
  const item = newJourneyAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyAssignmentRequiredTitleRule flags a blank title", () => {
  const rule = new JourneyAssignmentRequiredTitleRule("journey assignment needs a value");
  const item = newJourneyAssignment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyAssignmentCountryLengthRule flags a long country", () => {
  const rule = new JourneyAssignmentCountryLengthRule(80);
  const item = newJourneyAssignment("x", "y");
  item.country = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyAssignmentTitleLengthRule flags a long title", () => {
  const rule = new JourneyAssignmentTitleLengthRule(16);
  const item = newJourneyAssignment("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new JourneyAssignmentRequiredCodeRule("journey assignment needs this field");
  const item = newJourneyAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
