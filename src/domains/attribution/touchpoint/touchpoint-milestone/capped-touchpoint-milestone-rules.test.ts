import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedTouchpointMilestoneCampaignRefLengthRule,
  CappedTouchpointMilestoneRatioRangeRule,
  CappedTouchpointMilestoneRequiredCodeRule,
  defaultCappedTouchpointMilestoneValidator,
} from "./capped-touchpoint-milestone-rules.js";
import { newCappedTouchpointMilestone } from "./capped-touchpoint-milestone.js";

test("CappedTouchpointMilestoneValidator reports every problem", () => {
  const validator = defaultCappedTouchpointMilestoneValidator();
  const item = newCappedTouchpointMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedTouchpointMilestoneCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new CappedTouchpointMilestoneCampaignRefLengthRule(64);
  const item = newCappedTouchpointMilestone("x", "y");
  item.campaignRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedTouchpointMilestoneRatioRangeRule flags values above ratio", () => {
  const rule = new CappedTouchpointMilestoneRatioRangeRule(0.9, 4974.5);
  const item = newCappedTouchpointMilestone("x", "y");
  item.ratio = 4976;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedTouchpointMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new CappedTouchpointMilestoneRequiredCodeRule("capped touchpoint milestone needs this field");
  const item = newCappedTouchpointMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
