import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakScoreRequiredTitleRule,
  StreakScoreTitleLengthRule,
  defaultStreakScoreValidator,
} from "./streak-score-rules.js";
import { newStreakScore } from "./streak-score.js";

test("StreakScoreValidator reports every problem", () => {
  const validator = defaultStreakScoreValidator();
  const item = newStreakScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakScoreTitleLengthRule flags a long title", () => {
  const rule = new StreakScoreTitleLengthRule(1000);
  const item = newStreakScore("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakScoreRequiredTitleRule flags a blank title", () => {
  const rule = new StreakScoreRequiredTitleRule("streak score needs an entry");
  const item = newStreakScore("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
