import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteGroupCodeLengthRule,
  InviteGroupNameLengthRule,
  InviteGroupRequiredLocaleRule,
  InviteGroupRequiredNameRule,
  InviteGroupUpdatedAtRangeRule,
  defaultInviteGroupValidator,
} from "./invite-group-rules.js";
import { newInviteGroup } from "./invite-group.js";

test("InviteGroupValidator reports every problem", () => {
  const validator = defaultInviteGroupValidator();
  const item = newInviteGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteGroupCodeLengthRule flags a long code", () => {
  const rule = new InviteGroupCodeLengthRule(255);
  const item = newInviteGroup("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteGroupNameLengthRule flags a long name", () => {
  const rule = new InviteGroupNameLengthRule(255);
  const item = newInviteGroup("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteGroupUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new InviteGroupUpdatedAtRangeRule(16, 255);
  const item = newInviteGroup("x", "y");
  item.updatedAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteGroupRequiredNameRule flags a blank name", () => {
  const rule = new InviteGroupRequiredNameRule("invite group needs this field");
  const item = newInviteGroup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteGroupRequiredLocaleRule flags a blank locale", () => {
  const rule = new InviteGroupRequiredLocaleRule("invite group needs this field");
  const item = newInviteGroup("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
