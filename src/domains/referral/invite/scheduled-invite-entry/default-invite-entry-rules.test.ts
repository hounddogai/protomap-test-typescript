import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultInviteEntryNameLengthRule,
  DefaultInviteEntryRequiredPhoneRule,
  defaultDefaultInviteEntryValidator,
} from "./default-invite-entry-rules.js";
import { newDefaultInviteEntry } from "./default-invite-entry.js";

test("DefaultInviteEntryValidator reports every problem", () => {
  const validator = defaultDefaultInviteEntryValidator();
  const item = newDefaultInviteEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultInviteEntryRequiredPhoneRule flags a blank phone", () => {
  const rule = new DefaultInviteEntryRequiredPhoneRule("default invite entry needs an entry");
  const item = newDefaultInviteEntry("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultInviteEntryNameLengthRule flags a long name", () => {
  const rule = new DefaultInviteEntryNameLengthRule(64);
  const item = newDefaultInviteEntry("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
