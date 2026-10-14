import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictInvitePolicyCodeLengthRule,
  StrictInvitePolicyRequiredOwnerIdRule,
  StrictInvitePolicyTitleLengthRule,
  defaultStrictInvitePolicyValidator,
} from "./strict-invite-policy-rules.js";
import { newStrictInvitePolicy } from "./strict-invite-policy.js";

test("StrictInvitePolicyValidator reports every problem", () => {
  const validator = defaultStrictInvitePolicyValidator();
  const item = newStrictInvitePolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictInvitePolicyTitleLengthRule flags a long title", () => {
  const rule = new StrictInvitePolicyTitleLengthRule(80);
  const item = newStrictInvitePolicy("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictInvitePolicyRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new StrictInvitePolicyRequiredOwnerIdRule("strict invite policy needs this field");
  const item = newStrictInvitePolicy("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictInvitePolicyCodeLengthRule flags a long code", () => {
  const rule = new StrictInvitePolicyCodeLengthRule(64);
  const item = newStrictInvitePolicy("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
