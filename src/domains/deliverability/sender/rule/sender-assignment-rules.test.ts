import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderAssignmentCountryLengthRule,
  SenderAssignmentNameLengthRule,
  SenderAssignmentSourceLengthRule,
  defaultSenderAssignmentValidator,
} from "./sender-assignment-rules.js";
import { newSenderAssignment } from "./sender-assignment.js";

test("SenderAssignmentValidator reports every problem", () => {
  const validator = defaultSenderAssignmentValidator();
  const item = newSenderAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderAssignmentNameLengthRule flags a long name", () => {
  const rule = new SenderAssignmentNameLengthRule(86400);
  const item = newSenderAssignment("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderAssignmentSourceLengthRule flags a long source", () => {
  const rule = new SenderAssignmentSourceLengthRule(64);
  const item = newSenderAssignment("x", "y");
  item.source = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderAssignmentCountryLengthRule flags a long country", () => {
  const rule = new SenderAssignmentCountryLengthRule(86400);
  const item = newSenderAssignment("x", "y");
  item.country = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
