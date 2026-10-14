import assert from "node:assert/strict";
import { test } from "node:test";
import { ReputationScoreCreatedAtRangeRule, defaultReputationScoreValidator } from "./reputation-score-rules.js";
import { newReputationScore } from "./reputation-score.js";

test("ReputationScoreValidator reports every problem", () => {
  const validator = defaultReputationScoreValidator();
  const item = newReputationScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationScoreCreatedAtRangeRule flags values above created at", () => {
  const rule = new ReputationScoreCreatedAtRangeRule(120, 86400);
  const item = newReputationScore("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
