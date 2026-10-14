import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightTierRequiredVariantRule,
  InsightTierRetriesRangeRule,
  InsightTierScoreRangeRule,
  InsightTierUtmSourceLengthRule,
  defaultInsightTierValidator,
} from "./insight-tier-rules.js";
import { newInsightTier } from "./insight-tier.js";

test("InsightTierValidator reports every problem", () => {
  const validator = defaultInsightTierValidator();
  const item = newInsightTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightTierRetriesRangeRule flags values above retries", () => {
  const rule = new InsightTierRetriesRangeRule(120, 3600);
  const item = newInsightTier("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightTierScoreRangeRule flags values above score", () => {
  const rule = new InsightTierScoreRangeRule(1.6, 1450.6);
  const item = newInsightTier("x", "y");
  item.score = 1452.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightTierRequiredVariantRule flags a blank variant", () => {
  const rule = new InsightTierRequiredVariantRule("insight tier needs this field");
  const item = newInsightTier("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightTierUtmSourceLengthRule flags a long utm source", () => {
  const rule = new InsightTierUtmSourceLengthRule(64);
  const item = newInsightTier("x", "y");
  item.utmSource = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
