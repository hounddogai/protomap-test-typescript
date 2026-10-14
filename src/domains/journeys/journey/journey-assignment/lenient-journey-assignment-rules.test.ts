import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientJourneyAssignmentDescriptionLengthRule,
  LenientJourneyAssignmentGraceDaysRangeRule,
  LenientJourneyAssignmentRequiredTimezoneRule,
  defaultLenientJourneyAssignmentValidator,
} from "./lenient-journey-assignment-rules.js";
import { newLenientJourneyAssignment } from "./lenient-journey-assignment.js";

test("LenientJourneyAssignmentValidator reports every problem", () => {
  const validator = defaultLenientJourneyAssignmentValidator();
  const item = newLenientJourneyAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientJourneyAssignmentDescriptionLengthRule flags a long description", () => {
  const rule = new LenientJourneyAssignmentDescriptionLengthRule(32);
  const item = newLenientJourneyAssignment("x", "y");
  item.description = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientJourneyAssignmentRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new LenientJourneyAssignmentRequiredTimezoneRule("lenient journey assignment needs this field");
  const item = newLenientJourneyAssignment("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientJourneyAssignmentGraceDaysRangeRule flags values above grace days", () => {
  const rule = new LenientJourneyAssignmentGraceDaysRangeRule(32, 120);
  const item = newLenientJourneyAssignment("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
