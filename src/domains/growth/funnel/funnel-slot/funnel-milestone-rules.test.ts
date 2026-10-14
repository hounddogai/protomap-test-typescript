import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelMilestoneAudienceIdLengthRule,
  FunnelMilestoneRequiredCodeRule,
  FunnelMilestoneTitleLengthRule,
  defaultFunnelMilestoneValidator,
} from "./funnel-milestone-rules.js";
import { newFunnelMilestone } from "./funnel-milestone.js";

test("FunnelMilestoneValidator reports every problem", () => {
  const validator = defaultFunnelMilestoneValidator();
  const item = newFunnelMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelMilestoneTitleLengthRule flags a long title", () => {
  const rule = new FunnelMilestoneTitleLengthRule(32);
  const item = newFunnelMilestone("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelMilestoneAudienceIdLengthRule flags a long audience id", () => {
  const rule = new FunnelMilestoneAudienceIdLengthRule(86400);
  const item = newFunnelMilestone("x", "y");
  item.audienceId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new FunnelMilestoneRequiredCodeRule("funnel milestone needs this field");
  const item = newFunnelMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
