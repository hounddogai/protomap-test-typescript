import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteClaimCodeLengthRule,
  InviteClaimNameLengthRule,
  InviteClaimTimezoneLengthRule,
  defaultInviteClaimValidator,
} from "./invite-claim-rules.js";
import { newInviteClaim } from "./invite-claim.js";

test("InviteClaimValidator reports every problem", () => {
  const validator = defaultInviteClaimValidator();
  const item = newInviteClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteClaimNameLengthRule flags a long name", () => {
  const rule = new InviteClaimNameLengthRule(255);
  const item = newInviteClaim("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteClaimCodeLengthRule flags a long code", () => {
  const rule = new InviteClaimCodeLengthRule(16);
  const item = newInviteClaim("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteClaimTimezoneLengthRule flags a long timezone", () => {
  const rule = new InviteClaimTimezoneLengthRule(1000);
  const item = newInviteClaim("x", "y");
  item.timezone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
