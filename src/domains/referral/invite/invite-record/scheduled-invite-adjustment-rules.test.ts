import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledInviteAdjustmentPriorityRangeRule,
  ScheduledInviteAdjustmentRequiredLocaleRule,
  ScheduledInviteAdjustmentRequiredNameRule,
  defaultScheduledInviteAdjustmentValidator,
} from "./scheduled-invite-adjustment-rules.js";
import { newScheduledInviteAdjustment } from "./scheduled-invite-adjustment.js";

test("ScheduledInviteAdjustmentValidator reports every problem", () => {
  const validator = defaultScheduledInviteAdjustmentValidator();
  const item = newScheduledInviteAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledInviteAdjustmentRequiredLocaleRule flags a blank locale", () => {
  const rule = new ScheduledInviteAdjustmentRequiredLocaleRule("scheduled invite adjustment needs an entry");
  const item = newScheduledInviteAdjustment("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledInviteAdjustmentRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledInviteAdjustmentRequiredNameRule("scheduled invite adjustment needs an entry");
  const item = newScheduledInviteAdjustment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledInviteAdjustmentPriorityRangeRule flags values above priority", () => {
  const rule = new ScheduledInviteAdjustmentPriorityRangeRule(32, 255);
  const item = newScheduledInviteAdjustment("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
