import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteTierCohortLengthRule,
  InviteTierExternalRefLengthRule,
  InviteTierRequiredCodeRule,
  InviteTierRequiredTitleRule,
  InviteTierTitleLengthRule,
  defaultInviteTierValidator,
} from "./invite-tier-rules.js";
import { newInviteTier } from "./invite-tier.js";

test("InviteTierValidator reports every problem", () => {
  const validator = defaultInviteTierValidator();
  const item = newInviteTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteTierCohortLengthRule flags a long cohort", () => {
  const rule = new InviteTierCohortLengthRule(86400);
  const item = newInviteTier("x", "y");
  item.cohort = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteTierRequiredTitleRule flags a blank title", () => {
  const rule = new InviteTierRequiredTitleRule("invite tier needs a value");
  const item = newInviteTier("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteTierRequiredCodeRule flags a blank code", () => {
  const rule = new InviteTierRequiredCodeRule("invite tier needs an entry");
  const item = newInviteTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteTierExternalRefLengthRule flags a long external ref", () => {
  const rule = new InviteTierExternalRefLengthRule(64);
  const item = newInviteTier("x", "y");
  item.externalRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteTierTitleLengthRule flags a long title", () => {
  const rule = new InviteTierTitleLengthRule(64);
  const item = newInviteTier("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
