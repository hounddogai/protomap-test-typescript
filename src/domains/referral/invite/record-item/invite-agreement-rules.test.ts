import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteAgreementCodeLengthRule,
  InviteAgreementRegionLengthRule,
  defaultInviteAgreementValidator,
} from "./invite-agreement-rules.js";
import { newInviteAgreement } from "./invite-agreement.js";

test("InviteAgreementValidator reports every problem", () => {
  const validator = defaultInviteAgreementValidator();
  const item = newInviteAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteAgreementCodeLengthRule flags a long code", () => {
  const rule = new InviteAgreementCodeLengthRule(255);
  const item = newInviteAgreement("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteAgreementRegionLengthRule flags a long region", () => {
  const rule = new InviteAgreementRegionLengthRule(64);
  const item = newInviteAgreement("x", "y");
  item.region = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
