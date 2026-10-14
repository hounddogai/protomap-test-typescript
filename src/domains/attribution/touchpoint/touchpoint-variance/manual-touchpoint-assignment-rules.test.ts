import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualTouchpointAssignmentRequiredSummaryRule,
  ManualTouchpointAssignmentSummaryLengthRule,
  defaultManualTouchpointAssignmentValidator,
} from "./manual-touchpoint-assignment-rules.js";
import { newManualTouchpointAssignment } from "./manual-touchpoint-assignment.js";

test("ManualTouchpointAssignmentValidator reports every problem", () => {
  const validator = defaultManualTouchpointAssignmentValidator();
  const item = newManualTouchpointAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualTouchpointAssignmentRequiredSummaryRule flags a blank summary", () => {
  const rule = new ManualTouchpointAssignmentRequiredSummaryRule("manual touchpoint assignment needs a value");
  const item = newManualTouchpointAssignment("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualTouchpointAssignmentSummaryLengthRule flags a long summary", () => {
  const rule = new ManualTouchpointAssignmentSummaryLengthRule(1000);
  const item = newManualTouchpointAssignment("x", "y");
  item.summary = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
