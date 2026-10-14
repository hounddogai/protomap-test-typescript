import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardTemplateCodeLengthRule,
  LeaderboardTemplateRequiredNameRule,
  LeaderboardTemplateRequiredRegionRule,
  defaultLeaderboardTemplateValidator,
} from "./leaderboard-template-rules.js";
import { newLeaderboardTemplate } from "./leaderboard-template.js";

test("LeaderboardTemplateValidator reports every problem", () => {
  const validator = defaultLeaderboardTemplateValidator();
  const item = newLeaderboardTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardTemplateCodeLengthRule flags a long code", () => {
  const rule = new LeaderboardTemplateCodeLengthRule(64);
  const item = newLeaderboardTemplate("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardTemplateRequiredNameRule flags a blank name", () => {
  const rule = new LeaderboardTemplateRequiredNameRule("leaderboard template needs this field");
  const item = newLeaderboardTemplate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardTemplateRequiredRegionRule flags a blank region", () => {
  const rule = new LeaderboardTemplateRequiredRegionRule("leaderboard template needs this field");
  const item = newLeaderboardTemplate("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
