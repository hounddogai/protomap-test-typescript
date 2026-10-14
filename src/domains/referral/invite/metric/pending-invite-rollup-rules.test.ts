import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingInviteRollupNameLengthRule,
  PendingInviteRollupRequiredCodeRule,
  PendingInviteRollupRequiredExternalRefRule,
  PendingInviteRollupRequiredTitleRule,
  defaultPendingInviteRollupValidator,
} from "./pending-invite-rollup-rules.js";
import { newPendingInviteRollup } from "./pending-invite-rollup.js";

test("PendingInviteRollupValidator reports every problem", () => {
  const validator = defaultPendingInviteRollupValidator();
  const item = newPendingInviteRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingInviteRollupRequiredTitleRule flags a blank title", () => {
  const rule = new PendingInviteRollupRequiredTitleRule("pending invite rollup needs a value");
  const item = newPendingInviteRollup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingInviteRollupNameLengthRule flags a long name", () => {
  const rule = new PendingInviteRollupNameLengthRule(16);
  const item = newPendingInviteRollup("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingInviteRollupRequiredCodeRule flags a blank code", () => {
  const rule = new PendingInviteRollupRequiredCodeRule("pending invite rollup needs this field");
  const item = newPendingInviteRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingInviteRollupRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new PendingInviteRollupRequiredExternalRefRule("pending invite rollup needs a value");
  const item = newPendingInviteRollup("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
