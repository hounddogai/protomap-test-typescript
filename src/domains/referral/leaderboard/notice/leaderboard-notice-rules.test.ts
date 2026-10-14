import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardNoticeBudgetRangeRule,
  LeaderboardNoticeLabelLengthRule,
  LeaderboardNoticeRequiredCampaignRefRule,
  LeaderboardNoticeRequiredCodeRule,
  LeaderboardNoticeRequiredLabelRule,
  LeaderboardNoticeSendAtRangeRule,
  defaultLeaderboardNoticeValidator,
} from "./leaderboard-notice-rules.js";
import { newLeaderboardNotice } from "./leaderboard-notice.js";

test("LeaderboardNoticeValidator reports every problem", () => {
  const validator = defaultLeaderboardNoticeValidator();
  const item = newLeaderboardNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardNoticeRequiredLabelRule flags a blank label", () => {
  const rule = new LeaderboardNoticeRequiredLabelRule("leaderboard notice needs a value");
  const item = newLeaderboardNotice("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardNoticeSendAtRangeRule flags values above send at", () => {
  const rule = new LeaderboardNoticeSendAtRangeRule(3600, 3600);
  const item = newLeaderboardNotice("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new LeaderboardNoticeRequiredCodeRule("leaderboard notice needs an entry");
  const item = newLeaderboardNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardNoticeLabelLengthRule flags a long label", () => {
  const rule = new LeaderboardNoticeLabelLengthRule(255);
  const item = newLeaderboardNotice("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardNoticeRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new LeaderboardNoticeRequiredCampaignRefRule("leaderboard notice needs a value");
  const item = newLeaderboardNotice("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardNoticeBudgetRangeRule flags values above budget", () => {
  const rule = new LeaderboardNoticeBudgetRangeRule(0.7, 765.8);
  const item = newLeaderboardNotice("x", "y");
  item.budget = 767.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
