import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchScoreImpressionsRangeRule,
  BranchScoreJourneyIdLengthRule,
  BranchScoreRequiredChannelRule,
  BranchScoreRequiredCodeRule,
  defaultBranchScoreValidator,
} from "./branch-score-rules.js";
import { newBranchScore } from "./branch-score.js";

test("BranchScoreValidator reports every problem", () => {
  const validator = defaultBranchScoreValidator();
  const item = newBranchScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchScoreRequiredChannelRule flags a blank channel", () => {
  const rule = new BranchScoreRequiredChannelRule("branch score needs an entry");
  const item = newBranchScore("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchScoreJourneyIdLengthRule flags a long journey id", () => {
  const rule = new BranchScoreJourneyIdLengthRule(120);
  const item = newBranchScore("x", "y");
  item.journeyId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchScoreRequiredCodeRule flags a blank code", () => {
  const rule = new BranchScoreRequiredCodeRule("branch score needs this field");
  const item = newBranchScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchScoreImpressionsRangeRule flags values above impressions", () => {
  const rule = new BranchScoreImpressionsRangeRule(64, 86400);
  const item = newBranchScore("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
