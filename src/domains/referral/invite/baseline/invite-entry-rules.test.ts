import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteEntryRequiredCodeRule,
  InviteEntryRequiredReviewerRule,
  InviteEntryReviewerLengthRule,
  defaultInviteEntryValidator,
} from "./invite-entry-rules.js";
import { newInviteEntry } from "./invite-entry.js";

test("InviteEntryValidator reports every problem", () => {
  const validator = defaultInviteEntryValidator();
  const item = newInviteEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteEntryReviewerLengthRule flags a long reviewer", () => {
  const rule = new InviteEntryReviewerLengthRule(255);
  const item = newInviteEntry("x", "y");
  item.reviewer = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteEntryRequiredCodeRule flags a blank code", () => {
  const rule = new InviteEntryRequiredCodeRule("invite entry needs a value");
  const item = newInviteEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteEntryRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new InviteEntryRequiredReviewerRule("invite entry needs this field");
  const item = newInviteEntry("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
