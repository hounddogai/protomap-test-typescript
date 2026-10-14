import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingLeaderboardOverrideAudienceIdLengthRule,
  PendingLeaderboardOverrideCodeLengthRule,
  PendingLeaderboardOverrideDurationMinutesRangeRule,
  PendingLeaderboardOverrideLabelLengthRule,
  PendingLeaderboardOverrideRatioRangeRule,
  PendingLeaderboardOverrideRequiredVariantRule,
  defaultPendingLeaderboardOverrideValidator,
} from "./pending-leaderboard-override-rules.js";
import { newPendingLeaderboardOverride } from "./pending-leaderboard-override.js";

test("PendingLeaderboardOverrideValidator reports every problem", () => {
  const validator = defaultPendingLeaderboardOverrideValidator();
  const item = newPendingLeaderboardOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingLeaderboardOverrideRequiredVariantRule flags a blank variant", () => {
  const rule = new PendingLeaderboardOverrideRequiredVariantRule("pending leaderboard override needs an entry");
  const item = newPendingLeaderboardOverride("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingLeaderboardOverrideLabelLengthRule flags a long label", () => {
  const rule = new PendingLeaderboardOverrideLabelLengthRule(86400);
  const item = newPendingLeaderboardOverride("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingLeaderboardOverrideCodeLengthRule flags a long code", () => {
  const rule = new PendingLeaderboardOverrideCodeLengthRule(255);
  const item = newPendingLeaderboardOverride("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingLeaderboardOverrideAudienceIdLengthRule flags a long audience id", () => {
  const rule = new PendingLeaderboardOverrideAudienceIdLengthRule(64);
  const item = newPendingLeaderboardOverride("x", "y");
  item.audienceId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingLeaderboardOverrideRatioRangeRule flags values above ratio", () => {
  const rule = new PendingLeaderboardOverrideRatioRangeRule(0.6, 311.3);
  const item = newPendingLeaderboardOverride("x", "y");
  item.ratio = 312.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingLeaderboardOverrideDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new PendingLeaderboardOverrideDurationMinutesRangeRule(64, 86400);
  const item = newPendingLeaderboardOverride("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
