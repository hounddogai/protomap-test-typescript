import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalInviteMilestoneCodeLengthRule,
  SeasonalInviteMilestoneFrequencyCapRangeRule,
  SeasonalInviteMilestoneRequiredCodeRule,
  SeasonalInviteMilestoneTitleLengthRule,
  defaultSeasonalInviteMilestoneValidator,
} from "./seasonal-invite-milestone-rules.js";
import { newSeasonalInviteMilestone } from "./seasonal-invite-milestone.js";

test("SeasonalInviteMilestoneValidator reports every problem", () => {
  const validator = defaultSeasonalInviteMilestoneValidator();
  const item = newSeasonalInviteMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalInviteMilestoneFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new SeasonalInviteMilestoneFrequencyCapRangeRule(255, 86400);
  const item = newSeasonalInviteMilestone("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalInviteMilestoneCodeLengthRule flags a long code", () => {
  const rule = new SeasonalInviteMilestoneCodeLengthRule(80);
  const item = newSeasonalInviteMilestone("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalInviteMilestoneTitleLengthRule flags a long title", () => {
  const rule = new SeasonalInviteMilestoneTitleLengthRule(120);
  const item = newSeasonalInviteMilestone("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalInviteMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalInviteMilestoneRequiredCodeRule("seasonal invite milestone needs an entry");
  const item = newSeasonalInviteMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
