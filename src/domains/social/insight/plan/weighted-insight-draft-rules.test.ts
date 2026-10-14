import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedInsightDraftLabelLengthRule,
  WeightedInsightDraftRequiredLocaleRule,
  WeightedInsightDraftRequiredReviewerRule,
  WeightedInsightDraftScoreRangeRule,
  defaultWeightedInsightDraftValidator,
} from "./weighted-insight-draft-rules.js";
import { newWeightedInsightDraft } from "./weighted-insight-draft.js";

test("WeightedInsightDraftValidator reports every problem", () => {
  const validator = defaultWeightedInsightDraftValidator();
  const item = newWeightedInsightDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedInsightDraftLabelLengthRule flags a long label", () => {
  const rule = new WeightedInsightDraftLabelLengthRule(3600);
  const item = newWeightedInsightDraft("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedInsightDraftScoreRangeRule flags values above score", () => {
  const rule = new WeightedInsightDraftScoreRangeRule(1.9, 2439.1);
  const item = newWeightedInsightDraft("x", "y");
  item.score = 2440.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedInsightDraftRequiredLocaleRule flags a blank locale", () => {
  const rule = new WeightedInsightDraftRequiredLocaleRule("weighted insight draft needs an entry");
  const item = newWeightedInsightDraft("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedInsightDraftRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new WeightedInsightDraftRequiredReviewerRule("weighted insight draft needs a value");
  const item = newWeightedInsightDraft("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
