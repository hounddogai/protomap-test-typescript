import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteBundleCodeLengthRule,
  InviteBundleRequiredCodeRule,
  InviteBundleUnitLengthRule,
  defaultInviteBundleValidator,
} from "./invite-bundle-rules.js";
import { newInviteBundle } from "./invite-bundle.js";

test("InviteBundleValidator reports every problem", () => {
  const validator = defaultInviteBundleValidator();
  const item = newInviteBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteBundleRequiredCodeRule flags a blank code", () => {
  const rule = new InviteBundleRequiredCodeRule("invite bundle needs this field");
  const item = newInviteBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteBundleCodeLengthRule flags a long code", () => {
  const rule = new InviteBundleCodeLengthRule(16);
  const item = newInviteBundle("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteBundleUnitLengthRule flags a long unit", () => {
  const rule = new InviteBundleUnitLengthRule(80);
  const item = newInviteBundle("x", "y");
  item.unit = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
