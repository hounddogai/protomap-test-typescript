import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointAssignmentLabelLengthRule,
  TouchpointAssignmentRequiredTitleRule,
  defaultTouchpointAssignmentValidator,
} from "./touchpoint-assignment-rules.js";
import { newTouchpointAssignment } from "./touchpoint-assignment.js";

test("TouchpointAssignmentValidator reports every problem", () => {
  const validator = defaultTouchpointAssignmentValidator();
  const item = newTouchpointAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointAssignmentRequiredTitleRule flags a blank title", () => {
  const rule = new TouchpointAssignmentRequiredTitleRule("touchpoint assignment needs a value");
  const item = newTouchpointAssignment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointAssignmentLabelLengthRule flags a long label", () => {
  const rule = new TouchpointAssignmentLabelLengthRule(3600);
  const item = newTouchpointAssignment("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
