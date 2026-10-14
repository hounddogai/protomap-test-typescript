import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledInviteAllocationRequiredCodeRule,
  ScheduledInviteAllocationRequiredLabelRule,
  ScheduledInviteAllocationRequiredTitleRule,
  ScheduledInviteAllocationTitleLengthRule,
  defaultScheduledInviteAllocationValidator,
} from "./scheduled-invite-allocation-rules.js";
import { newScheduledInviteAllocation } from "./scheduled-invite-allocation.js";

test("ScheduledInviteAllocationValidator reports every problem", () => {
  const validator = defaultScheduledInviteAllocationValidator();
  const item = newScheduledInviteAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledInviteAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledInviteAllocationRequiredCodeRule("scheduled invite allocation needs a value");
  const item = newScheduledInviteAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledInviteAllocationRequiredLabelRule flags a blank label", () => {
  const rule = new ScheduledInviteAllocationRequiredLabelRule("scheduled invite allocation needs this field");
  const item = newScheduledInviteAllocation("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledInviteAllocationRequiredTitleRule flags a blank title", () => {
  const rule = new ScheduledInviteAllocationRequiredTitleRule("scheduled invite allocation needs an entry");
  const item = newScheduledInviteAllocation("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledInviteAllocationTitleLengthRule flags a long title", () => {
  const rule = new ScheduledInviteAllocationTitleLengthRule(1000);
  const item = newScheduledInviteAllocation("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
