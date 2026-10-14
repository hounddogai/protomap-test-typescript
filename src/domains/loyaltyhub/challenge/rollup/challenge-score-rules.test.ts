import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeScoreOpenRateRangeRule,
  ChallengeScoreRequiredTitleRule,
  defaultChallengeScoreValidator,
} from "./challenge-score-rules.js";
import { newChallengeScore } from "./challenge-score.js";

test("ChallengeScoreValidator reports every problem", () => {
  const validator = defaultChallengeScoreValidator();
  const item = newChallengeScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeScoreOpenRateRangeRule flags values above open rate", () => {
  const rule = new ChallengeScoreOpenRateRangeRule(4.9, 2987.2);
  const item = newChallengeScore("x", "y");
  item.openRate = 2988.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeScoreRequiredTitleRule flags a blank title", () => {
  const rule = new ChallengeScoreRequiredTitleRule("challenge score needs an entry");
  const item = newChallengeScore("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
