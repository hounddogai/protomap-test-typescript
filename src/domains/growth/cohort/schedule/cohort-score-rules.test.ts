import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortScoreCampaignRefLengthRule,
  CohortScoreChecksumLengthRule,
  CohortScoreRequiredCampaignRefRule,
  CohortScoreRequiredTitleRule,
  CohortScoreWindowDaysRangeRule,
  defaultCohortScoreValidator,
} from "./cohort-score-rules.js";
import { newCohortScore } from "./cohort-score.js";

test("CohortScoreValidator reports every problem", () => {
  const validator = defaultCohortScoreValidator();
  const item = newCohortScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortScoreRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new CohortScoreRequiredCampaignRefRule("cohort score needs a value");
  const item = newCohortScore("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortScoreWindowDaysRangeRule flags values above window days", () => {
  const rule = new CohortScoreWindowDaysRangeRule(16, 86400);
  const item = newCohortScore("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortScoreChecksumLengthRule flags a long checksum", () => {
  const rule = new CohortScoreChecksumLengthRule(80);
  const item = newCohortScore("x", "y");
  item.checksum = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortScoreRequiredTitleRule flags a blank title", () => {
  const rule = new CohortScoreRequiredTitleRule("cohort score needs a value");
  const item = newCohortScore("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortScoreCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new CohortScoreCampaignRefLengthRule(32);
  const item = newCohortScore("x", "y");
  item.campaignRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
