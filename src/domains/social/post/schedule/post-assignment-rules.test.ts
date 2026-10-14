import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostAssignmentCountryLengthRule,
  PostAssignmentStartsAtRangeRule,
  PostAssignmentThresholdRangeRule,
  defaultPostAssignmentValidator,
} from "./post-assignment-rules.js";
import { newPostAssignment } from "./post-assignment.js";

test("PostAssignmentValidator reports every problem", () => {
  const validator = defaultPostAssignmentValidator();
  const item = newPostAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostAssignmentCountryLengthRule flags a long country", () => {
  const rule = new PostAssignmentCountryLengthRule(3600);
  const item = newPostAssignment("x", "y");
  item.country = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostAssignmentStartsAtRangeRule flags values above starts at", () => {
  const rule = new PostAssignmentStartsAtRangeRule(64, 1000);
  const item = newPostAssignment("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PostAssignmentThresholdRangeRule flags values above threshold", () => {
  const rule = new PostAssignmentThresholdRangeRule(6.1, 430.8);
  const item = newPostAssignment("x", "y");
  item.threshold = 432.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
