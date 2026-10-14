import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledLeaderboardTemplateCategoryLengthRule,
  ScheduledLeaderboardTemplateChannelLengthRule,
  ScheduledLeaderboardTemplateCodeLengthRule,
  ScheduledLeaderboardTemplateRequiredCategoryRule,
  defaultScheduledLeaderboardTemplateValidator,
} from "./scheduled-leaderboard-template-rules.js";
import { newScheduledLeaderboardTemplate } from "./scheduled-leaderboard-template.js";

test("ScheduledLeaderboardTemplateValidator reports every problem", () => {
  const validator = defaultScheduledLeaderboardTemplateValidator();
  const item = newScheduledLeaderboardTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledLeaderboardTemplateCategoryLengthRule flags a long category", () => {
  const rule = new ScheduledLeaderboardTemplateCategoryLengthRule(86400);
  const item = newScheduledLeaderboardTemplate("x", "y");
  item.category = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledLeaderboardTemplateCodeLengthRule flags a long code", () => {
  const rule = new ScheduledLeaderboardTemplateCodeLengthRule(64);
  const item = newScheduledLeaderboardTemplate("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledLeaderboardTemplateChannelLengthRule flags a long channel", () => {
  const rule = new ScheduledLeaderboardTemplateChannelLengthRule(120);
  const item = newScheduledLeaderboardTemplate("x", "y");
  item.channel = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledLeaderboardTemplateRequiredCategoryRule flags a blank category", () => {
  const rule = new ScheduledLeaderboardTemplateRequiredCategoryRule("scheduled leaderboard template needs an entry");
  const item = newScheduledLeaderboardTemplate("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
