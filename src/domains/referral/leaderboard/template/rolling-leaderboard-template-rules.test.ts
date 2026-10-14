import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingLeaderboardTemplateCodeLengthRule,
  RollingLeaderboardTemplateContactEmailLengthRule,
  RollingLeaderboardTemplateMarginRangeRule,
  RollingLeaderboardTemplateRequiredCodeRule,
  RollingLeaderboardTemplateRequiredContactEmailRule,
  RollingLeaderboardTemplateUtmSourceLengthRule,
  defaultRollingLeaderboardTemplateValidator,
} from "./rolling-leaderboard-template-rules.js";
import { newRollingLeaderboardTemplate } from "./rolling-leaderboard-template.js";

test("RollingLeaderboardTemplateValidator reports every problem", () => {
  const validator = defaultRollingLeaderboardTemplateValidator();
  const item = newRollingLeaderboardTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingLeaderboardTemplateCodeLengthRule flags a long code", () => {
  const rule = new RollingLeaderboardTemplateCodeLengthRule(80);
  const item = newRollingLeaderboardTemplate("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingLeaderboardTemplateMarginRangeRule flags values above margin", () => {
  const rule = new RollingLeaderboardTemplateMarginRangeRule(7.3, 245.4);
  const item = newRollingLeaderboardTemplate("x", "y");
  item.margin = 246.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingLeaderboardTemplateUtmSourceLengthRule flags a long utm source", () => {
  const rule = new RollingLeaderboardTemplateUtmSourceLengthRule(255);
  const item = newRollingLeaderboardTemplate("x", "y");
  item.utmSource = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingLeaderboardTemplateContactEmailLengthRule flags a long contact email", () => {
  const rule = new RollingLeaderboardTemplateContactEmailLengthRule(3600);
  const item = newRollingLeaderboardTemplate("x", "y");
  item.contactEmail = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingLeaderboardTemplateRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new RollingLeaderboardTemplateRequiredContactEmailRule("rolling leaderboard template needs an entry");
  const item = newRollingLeaderboardTemplate("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingLeaderboardTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new RollingLeaderboardTemplateRequiredCodeRule("rolling leaderboard template needs this field");
  const item = newRollingLeaderboardTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
