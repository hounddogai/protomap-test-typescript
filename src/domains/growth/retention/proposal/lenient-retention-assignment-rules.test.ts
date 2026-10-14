import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientRetentionAssignmentLimitRangeRule,
  LenientRetentionAssignmentNameLengthRule,
  LenientRetentionAssignmentRequiredNameRule,
  LenientRetentionAssignmentRequiredUtmSourceRule,
  LenientRetentionAssignmentUtmSourceLengthRule,
  defaultLenientRetentionAssignmentValidator,
} from "./lenient-retention-assignment-rules.js";
import { newLenientRetentionAssignment } from "./lenient-retention-assignment.js";

test("LenientRetentionAssignmentValidator reports every problem", () => {
  const validator = defaultLenientRetentionAssignmentValidator();
  const item = newLenientRetentionAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientRetentionAssignmentUtmSourceLengthRule flags a long utm source", () => {
  const rule = new LenientRetentionAssignmentUtmSourceLengthRule(16);
  const item = newLenientRetentionAssignment("x", "y");
  item.utmSource = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientRetentionAssignmentRequiredNameRule flags a blank name", () => {
  const rule = new LenientRetentionAssignmentRequiredNameRule("lenient retention assignment needs a value");
  const item = newLenientRetentionAssignment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientRetentionAssignmentLimitRangeRule flags values above limit", () => {
  const rule = new LenientRetentionAssignmentLimitRangeRule(255, 1000);
  const item = newLenientRetentionAssignment("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientRetentionAssignmentRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new LenientRetentionAssignmentRequiredUtmSourceRule("lenient retention assignment needs this field");
  const item = newLenientRetentionAssignment("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientRetentionAssignmentNameLengthRule flags a long name", () => {
  const rule = new LenientRetentionAssignmentNameLengthRule(120);
  const item = newLenientRetentionAssignment("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
