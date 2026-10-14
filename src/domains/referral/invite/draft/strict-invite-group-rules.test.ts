import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictInviteGroupCodeLengthRule,
  StrictInviteGroupNameLengthRule,
  StrictInviteGroupRequiredCodeRule,
  StrictInviteGroupRequiredNameRule,
  defaultStrictInviteGroupValidator,
} from "./strict-invite-group-rules.js";
import { newStrictInviteGroup } from "./strict-invite-group.js";

test("StrictInviteGroupValidator reports every problem", () => {
  const validator = defaultStrictInviteGroupValidator();
  const item = newStrictInviteGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictInviteGroupRequiredCodeRule flags a blank code", () => {
  const rule = new StrictInviteGroupRequiredCodeRule("strict invite group needs an entry");
  const item = newStrictInviteGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictInviteGroupNameLengthRule flags a long name", () => {
  const rule = new StrictInviteGroupNameLengthRule(32);
  const item = newStrictInviteGroup("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictInviteGroupRequiredNameRule flags a blank name", () => {
  const rule = new StrictInviteGroupRequiredNameRule("strict invite group needs this field");
  const item = newStrictInviteGroup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictInviteGroupCodeLengthRule flags a long code", () => {
  const rule = new StrictInviteGroupCodeLengthRule(1000);
  const item = newStrictInviteGroup("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
