import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryInviteAssignmentCodeLengthRule,
  PrimaryInviteAssignmentVariantLengthRule,
  defaultPrimaryInviteAssignmentValidator,
} from "./primary-invite-assignment-rules.js";
import { newPrimaryInviteAssignment } from "./primary-invite-assignment.js";

test("PrimaryInviteAssignmentValidator reports every problem", () => {
  const validator = defaultPrimaryInviteAssignmentValidator();
  const item = newPrimaryInviteAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryInviteAssignmentVariantLengthRule flags a long variant", () => {
  const rule = new PrimaryInviteAssignmentVariantLengthRule(32);
  const item = newPrimaryInviteAssignment("x", "y");
  item.variant = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryInviteAssignmentCodeLengthRule flags a long code", () => {
  const rule = new PrimaryInviteAssignmentCodeLengthRule(1000);
  const item = newPrimaryInviteAssignment("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
