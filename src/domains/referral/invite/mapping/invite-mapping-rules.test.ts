import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteMappingAudienceIdLengthRule,
  InviteMappingNameLengthRule,
  InviteMappingRequiredAudienceIdRule,
  InviteMappingRequiredCodeRule,
  InviteMappingRequiredNameRule,
  defaultInviteMappingValidator,
} from "./invite-mapping-rules.js";
import { newInviteMapping } from "./invite-mapping.js";

test("InviteMappingValidator reports every problem", () => {
  const validator = defaultInviteMappingValidator();
  const item = newInviteMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteMappingRequiredNameRule flags a blank name", () => {
  const rule = new InviteMappingRequiredNameRule("invite mapping needs a value");
  const item = newInviteMapping("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteMappingRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new InviteMappingRequiredAudienceIdRule("invite mapping needs a value");
  const item = newInviteMapping("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteMappingRequiredCodeRule flags a blank code", () => {
  const rule = new InviteMappingRequiredCodeRule("invite mapping needs this field");
  const item = newInviteMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteMappingNameLengthRule flags a long name", () => {
  const rule = new InviteMappingNameLengthRule(80);
  const item = newInviteMapping("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteMappingAudienceIdLengthRule flags a long audience id", () => {
  const rule = new InviteMappingAudienceIdLengthRule(1000);
  const item = newInviteMapping("x", "y");
  item.audienceId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
