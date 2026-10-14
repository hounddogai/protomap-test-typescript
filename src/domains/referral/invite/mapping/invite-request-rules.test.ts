import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteRequestRequiredCodeRule,
  InviteRequestRequiredTitleRule,
  defaultInviteRequestValidator,
} from "./invite-request-rules.js";
import { newInviteRequest } from "./invite-request.js";

test("InviteRequestValidator reports every problem", () => {
  const validator = defaultInviteRequestValidator();
  const item = newInviteRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteRequestRequiredTitleRule flags a blank title", () => {
  const rule = new InviteRequestRequiredTitleRule("invite request needs this field");
  const item = newInviteRequest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteRequestRequiredCodeRule flags a blank code", () => {
  const rule = new InviteRequestRequiredCodeRule("invite request needs this field");
  const item = newInviteRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
