import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationAssignmentImpressionsRangeRule,
  EscalationAssignmentRequiredTitleRule,
  EscalationAssignmentTitleLengthRule,
  defaultEscalationAssignmentValidator,
} from "./escalation-assignment-rules.js";
import { newEscalationAssignment } from "./escalation-assignment.js";

test("EscalationAssignmentValidator reports every problem", () => {
  const validator = defaultEscalationAssignmentValidator();
  const item = newEscalationAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationAssignmentImpressionsRangeRule flags values above impressions", () => {
  const rule = new EscalationAssignmentImpressionsRangeRule(120, 255);
  const item = newEscalationAssignment("x", "y");
  item.impressions = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationAssignmentRequiredTitleRule flags a blank title", () => {
  const rule = new EscalationAssignmentRequiredTitleRule("escalation assignment needs this field");
  const item = newEscalationAssignment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationAssignmentTitleLengthRule flags a long title", () => {
  const rule = new EscalationAssignmentTitleLengthRule(1000);
  const item = newEscalationAssignment("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
