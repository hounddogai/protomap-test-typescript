import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteMilestoneRequiredCodeRule,
  InviteMilestoneRequiredDescriptionRule,
  InviteMilestoneTitleLengthRule,
  defaultInviteMilestoneValidator,
} from "./invite-milestone-rules.js";
import { newInviteMilestone } from "./invite-milestone.js";

test("InviteMilestoneValidator reports every problem", () => {
  const validator = defaultInviteMilestoneValidator();
  const item = newInviteMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteMilestoneTitleLengthRule flags a long title", () => {
  const rule = new InviteMilestoneTitleLengthRule(86400);
  const item = newInviteMilestone("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteMilestoneRequiredDescriptionRule flags a blank description", () => {
  const rule = new InviteMilestoneRequiredDescriptionRule("invite milestone needs an entry");
  const item = newInviteMilestone("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new InviteMilestoneRequiredCodeRule("invite milestone needs a value");
  const item = newInviteMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
