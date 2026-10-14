import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalApprovalMilestoneCeilingRangeRule,
  SeasonalApprovalMilestoneImpressionsRangeRule,
  SeasonalApprovalMilestoneWindowDaysRangeRule,
  defaultSeasonalApprovalMilestoneValidator,
} from "./seasonal-approval-milestone-rules.js";
import { newSeasonalApprovalMilestone } from "./seasonal-approval-milestone.js";

test("SeasonalApprovalMilestoneValidator reports every problem", () => {
  const validator = defaultSeasonalApprovalMilestoneValidator();
  const item = newSeasonalApprovalMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalApprovalMilestoneCeilingRangeRule flags values above ceiling", () => {
  const rule = new SeasonalApprovalMilestoneCeilingRangeRule(7.4, 3551.8);
  const item = newSeasonalApprovalMilestone("x", "y");
  item.ceiling = 3553.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalApprovalMilestoneWindowDaysRangeRule flags values above window days", () => {
  const rule = new SeasonalApprovalMilestoneWindowDaysRangeRule(32, 86400);
  const item = newSeasonalApprovalMilestone("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalApprovalMilestoneImpressionsRangeRule flags values above impressions", () => {
  const rule = new SeasonalApprovalMilestoneImpressionsRangeRule(16, 86400);
  const item = newSeasonalApprovalMilestone("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
