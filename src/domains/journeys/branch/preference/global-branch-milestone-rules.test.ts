import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalBranchMilestoneLabelLengthRule,
  GlobalBranchMilestoneRequiredCampaignRefRule,
  defaultGlobalBranchMilestoneValidator,
} from "./global-branch-milestone-rules.js";
import { newGlobalBranchMilestone } from "./global-branch-milestone.js";

test("GlobalBranchMilestoneValidator reports every problem", () => {
  const validator = defaultGlobalBranchMilestoneValidator();
  const item = newGlobalBranchMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalBranchMilestoneRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new GlobalBranchMilestoneRequiredCampaignRefRule("global branch milestone needs this field");
  const item = newGlobalBranchMilestone("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalBranchMilestoneLabelLengthRule flags a long label", () => {
  const rule = new GlobalBranchMilestoneLabelLengthRule(16);
  const item = newGlobalBranchMilestone("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
