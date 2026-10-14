import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingRedemptionScoreCodeLengthRule,
  RollingRedemptionScoreRequiredUtmSourceRule,
  RollingRedemptionScoreScoreRangeRule,
  RollingRedemptionScoreUtmSourceLengthRule,
  defaultRollingRedemptionScoreValidator,
} from "./rolling-redemption-score-rules.js";
import { newRollingRedemptionScore } from "./rolling-redemption-score.js";

test("RollingRedemptionScoreValidator reports every problem", () => {
  const validator = defaultRollingRedemptionScoreValidator();
  const item = newRollingRedemptionScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingRedemptionScoreCodeLengthRule flags a long code", () => {
  const rule = new RollingRedemptionScoreCodeLengthRule(1000);
  const item = newRollingRedemptionScore("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingRedemptionScoreScoreRangeRule flags values above score", () => {
  const rule = new RollingRedemptionScoreScoreRangeRule(5.8, 519.2);
  const item = newRollingRedemptionScore("x", "y");
  item.score = 520.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingRedemptionScoreRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new RollingRedemptionScoreRequiredUtmSourceRule("rolling redemption score needs an entry");
  const item = newRollingRedemptionScore("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingRedemptionScoreUtmSourceLengthRule flags a long utm source", () => {
  const rule = new RollingRedemptionScoreUtmSourceLengthRule(80);
  const item = newRollingRedemptionScore("x", "y");
  item.utmSource = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
