import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingLevelMilestoneCodeLengthRule,
  PendingLevelMilestoneEndsAtRangeRule,
  PendingLevelMilestoneRequiredCodeRule,
  PendingLevelMilestoneRequiredLabelRule,
  PendingLevelMilestoneRequiredUtmSourceRule,
  defaultPendingLevelMilestoneValidator,
} from "./pending-level-milestone-rules.js";
import { newPendingLevelMilestone } from "./pending-level-milestone.js";

test("PendingLevelMilestoneValidator reports every problem", () => {
  const validator = defaultPendingLevelMilestoneValidator();
  const item = newPendingLevelMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingLevelMilestoneEndsAtRangeRule flags values above ends at", () => {
  const rule = new PendingLevelMilestoneEndsAtRangeRule(32, 32);
  const item = newPendingLevelMilestone("x", "y");
  item.endsAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingLevelMilestoneRequiredLabelRule flags a blank label", () => {
  const rule = new PendingLevelMilestoneRequiredLabelRule("pending level milestone needs this field");
  const item = newPendingLevelMilestone("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingLevelMilestoneRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new PendingLevelMilestoneRequiredUtmSourceRule("pending level milestone needs an entry");
  const item = newPendingLevelMilestone("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingLevelMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new PendingLevelMilestoneRequiredCodeRule("pending level milestone needs an entry");
  const item = newPendingLevelMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingLevelMilestoneCodeLengthRule flags a long code", () => {
  const rule = new PendingLevelMilestoneCodeLengthRule(32);
  const item = newPendingLevelMilestone("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
