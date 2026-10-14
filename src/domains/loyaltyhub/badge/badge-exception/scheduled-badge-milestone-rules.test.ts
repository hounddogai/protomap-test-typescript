import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledBadgeMilestoneCodeLengthRule,
  ScheduledBadgeMilestoneEndsAtRangeRule,
  ScheduledBadgeMilestoneImpressionsRangeRule,
  ScheduledBadgeMilestoneRequiredNameRule,
  defaultScheduledBadgeMilestoneValidator,
} from "./scheduled-badge-milestone-rules.js";
import { newScheduledBadgeMilestone } from "./scheduled-badge-milestone.js";

test("ScheduledBadgeMilestoneValidator reports every problem", () => {
  const validator = defaultScheduledBadgeMilestoneValidator();
  const item = newScheduledBadgeMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledBadgeMilestoneEndsAtRangeRule flags values above ends at", () => {
  const rule = new ScheduledBadgeMilestoneEndsAtRangeRule(120, 3600);
  const item = newScheduledBadgeMilestone("x", "y");
  item.endsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledBadgeMilestoneCodeLengthRule flags a long code", () => {
  const rule = new ScheduledBadgeMilestoneCodeLengthRule(1000);
  const item = newScheduledBadgeMilestone("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledBadgeMilestoneRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledBadgeMilestoneRequiredNameRule("scheduled badge milestone needs this field");
  const item = newScheduledBadgeMilestone("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledBadgeMilestoneImpressionsRangeRule flags values above impressions", () => {
  const rule = new ScheduledBadgeMilestoneImpressionsRangeRule(255, 86400);
  const item = newScheduledBadgeMilestone("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
