import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredRetentionScoreEndsAtRangeRule,
  TieredRetentionScoreLabelLengthRule,
  TieredRetentionScoreRequiredLocaleRule,
  TieredRetentionScoreRequiredTitleRule,
  defaultTieredRetentionScoreValidator,
} from "./tiered-retention-score-rules.js";
import { newTieredRetentionScore } from "./tiered-retention-score.js";

test("TieredRetentionScoreValidator reports every problem", () => {
  const validator = defaultTieredRetentionScoreValidator();
  const item = newTieredRetentionScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredRetentionScoreRequiredLocaleRule flags a blank locale", () => {
  const rule = new TieredRetentionScoreRequiredLocaleRule("tiered retention score needs an entry");
  const item = newTieredRetentionScore("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRetentionScoreLabelLengthRule flags a long label", () => {
  const rule = new TieredRetentionScoreLabelLengthRule(16);
  const item = newTieredRetentionScore("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredRetentionScoreEndsAtRangeRule flags values above ends at", () => {
  const rule = new TieredRetentionScoreEndsAtRangeRule(64, 80);
  const item = newTieredRetentionScore("x", "y");
  item.endsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredRetentionScoreRequiredTitleRule flags a blank title", () => {
  const rule = new TieredRetentionScoreRequiredTitleRule("tiered retention score needs an entry");
  const item = newTieredRetentionScore("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
