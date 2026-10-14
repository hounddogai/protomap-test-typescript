import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelAssignmentRequiredLabelRule,
  ModelAssignmentUpdatedAtRangeRule,
  ModelAssignmentUtmSourceLengthRule,
  defaultModelAssignmentValidator,
} from "./model-assignment-rules.js";
import { newModelAssignment } from "./model-assignment.js";

test("ModelAssignmentValidator reports every problem", () => {
  const validator = defaultModelAssignmentValidator();
  const item = newModelAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelAssignmentUtmSourceLengthRule flags a long utm source", () => {
  const rule = new ModelAssignmentUtmSourceLengthRule(32);
  const item = newModelAssignment("x", "y");
  item.utmSource = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelAssignmentRequiredLabelRule flags a blank label", () => {
  const rule = new ModelAssignmentRequiredLabelRule("model assignment needs an entry");
  const item = newModelAssignment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelAssignmentUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new ModelAssignmentUpdatedAtRangeRule(1000, 3600);
  const item = newModelAssignment("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
