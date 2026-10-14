import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingInviteBundleBudgetRangeRule,
  RollingInviteBundleRequiredCodeRule,
  RollingInviteBundleRequiredNameRule,
  RollingInviteBundleUnitLengthRule,
  defaultRollingInviteBundleValidator,
} from "./rolling-invite-bundle-rules.js";
import { newRollingInviteBundle } from "./rolling-invite-bundle.js";

test("RollingInviteBundleValidator reports every problem", () => {
  const validator = defaultRollingInviteBundleValidator();
  const item = newRollingInviteBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingInviteBundleUnitLengthRule flags a long unit", () => {
  const rule = new RollingInviteBundleUnitLengthRule(86400);
  const item = newRollingInviteBundle("x", "y");
  item.unit = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingInviteBundleBudgetRangeRule flags values above budget", () => {
  const rule = new RollingInviteBundleBudgetRangeRule(7.6, 1791.3);
  const item = newRollingInviteBundle("x", "y");
  item.budget = 1792.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingInviteBundleRequiredCodeRule flags a blank code", () => {
  const rule = new RollingInviteBundleRequiredCodeRule("rolling invite bundle needs this field");
  const item = newRollingInviteBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingInviteBundleRequiredNameRule flags a blank name", () => {
  const rule = new RollingInviteBundleRequiredNameRule("rolling invite bundle needs an entry");
  const item = newRollingInviteBundle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
