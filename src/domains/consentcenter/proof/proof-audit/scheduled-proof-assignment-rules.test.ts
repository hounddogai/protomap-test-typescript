import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledProofAssignmentCeilingRangeRule,
  ScheduledProofAssignmentRateRangeRule,
  ScheduledProofAssignmentSourceLengthRule,
  defaultScheduledProofAssignmentValidator,
} from "./scheduled-proof-assignment-rules.js";
import { newScheduledProofAssignment } from "./scheduled-proof-assignment.js";

test("ScheduledProofAssignmentValidator reports every problem", () => {
  const validator = defaultScheduledProofAssignmentValidator();
  const item = newScheduledProofAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledProofAssignmentRateRangeRule flags values above rate", () => {
  const rule = new ScheduledProofAssignmentRateRangeRule(9.4, 374.9);
  const item = newScheduledProofAssignment("x", "y");
  item.rate = 376.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledProofAssignmentSourceLengthRule flags a long source", () => {
  const rule = new ScheduledProofAssignmentSourceLengthRule(86400);
  const item = newScheduledProofAssignment("x", "y");
  item.source = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledProofAssignmentCeilingRangeRule flags values above ceiling", () => {
  const rule = new ScheduledProofAssignmentCeilingRangeRule(6.9, 3950.6);
  const item = newScheduledProofAssignment("x", "y");
  item.ceiling = 3952.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
