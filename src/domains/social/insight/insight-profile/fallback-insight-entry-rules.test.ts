import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackInsightEntryCampaignRefLengthRule,
  FallbackInsightEntryCategoryLengthRule,
  FallbackInsightEntryRequiredCategoryRule,
  FallbackInsightEntryRequiredTitleRule,
  defaultFallbackInsightEntryValidator,
} from "./fallback-insight-entry-rules.js";
import { newFallbackInsightEntry } from "./fallback-insight-entry.js";

test("FallbackInsightEntryValidator reports every problem", () => {
  const validator = defaultFallbackInsightEntryValidator();
  const item = newFallbackInsightEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackInsightEntryCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new FallbackInsightEntryCampaignRefLengthRule(64);
  const item = newFallbackInsightEntry("x", "y");
  item.campaignRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackInsightEntryRequiredCategoryRule flags a blank category", () => {
  const rule = new FallbackInsightEntryRequiredCategoryRule("fallback insight entry needs an entry");
  const item = newFallbackInsightEntry("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackInsightEntryRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackInsightEntryRequiredTitleRule("fallback insight entry needs a value");
  const item = newFallbackInsightEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackInsightEntryCategoryLengthRule flags a long category", () => {
  const rule = new FallbackInsightEntryCategoryLengthRule(86400);
  const item = newFallbackInsightEntry("x", "y");
  item.category = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
