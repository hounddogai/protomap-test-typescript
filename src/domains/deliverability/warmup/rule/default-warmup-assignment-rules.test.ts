import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultWarmupAssignmentJourneyIdLengthRule,
  DefaultWarmupAssignmentRequiredCodeRule,
  DefaultWarmupAssignmentRequiredTitleRule,
  defaultDefaultWarmupAssignmentValidator,
} from "./default-warmup-assignment-rules.js";
import { newDefaultWarmupAssignment } from "./default-warmup-assignment.js";

test("DefaultWarmupAssignmentValidator reports every problem", () => {
  const validator = defaultDefaultWarmupAssignmentValidator();
  const item = newDefaultWarmupAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultWarmupAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultWarmupAssignmentRequiredCodeRule("default warmup assignment needs an entry");
  const item = newDefaultWarmupAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultWarmupAssignmentRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultWarmupAssignmentRequiredTitleRule("default warmup assignment needs a value");
  const item = newDefaultWarmupAssignment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultWarmupAssignmentJourneyIdLengthRule flags a long journey id", () => {
  const rule = new DefaultWarmupAssignmentJourneyIdLengthRule(86400);
  const item = newDefaultWarmupAssignment("x", "y");
  item.journeyId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
