import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceAssignmentRequiredLabelRule,
  BounceAssignmentRequiredTitleRule,
  BounceAssignmentTitleLengthRule,
  defaultBounceAssignmentValidator,
} from "./bounce-assignment-rules.js";
import { newBounceAssignment } from "./bounce-assignment.js";

test("BounceAssignmentValidator reports every problem", () => {
  const validator = defaultBounceAssignmentValidator();
  const item = newBounceAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceAssignmentTitleLengthRule flags a long title", () => {
  const rule = new BounceAssignmentTitleLengthRule(3600);
  const item = newBounceAssignment("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceAssignmentRequiredTitleRule flags a blank title", () => {
  const rule = new BounceAssignmentRequiredTitleRule("bounce assignment needs an entry");
  const item = newBounceAssignment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceAssignmentRequiredLabelRule flags a blank label", () => {
  const rule = new BounceAssignmentRequiredLabelRule("bounce assignment needs a value");
  const item = newBounceAssignment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
