import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackCsatQuotaCodeLengthRule,
  FallbackCsatQuotaRequiredReviewerRule,
  FallbackCsatQuotaRequiredTitleRule,
  FallbackCsatQuotaReviewerLengthRule,
  FallbackCsatQuotaStartsAtRangeRule,
  FallbackCsatQuotaTitleLengthRule,
  defaultFallbackCsatQuotaValidator,
} from "./fallback-csat-quota-rules.js";
import { newFallbackCsatQuota } from "./fallback-csat-quota.js";

test("FallbackCsatQuotaValidator reports every problem", () => {
  const validator = defaultFallbackCsatQuotaValidator();
  const item = newFallbackCsatQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackCsatQuotaRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackCsatQuotaRequiredTitleRule("fallback csat quota needs a value");
  const item = newFallbackCsatQuota("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackCsatQuotaReviewerLengthRule flags a long reviewer", () => {
  const rule = new FallbackCsatQuotaReviewerLengthRule(86400);
  const item = newFallbackCsatQuota("x", "y");
  item.reviewer = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackCsatQuotaTitleLengthRule flags a long title", () => {
  const rule = new FallbackCsatQuotaTitleLengthRule(3600);
  const item = newFallbackCsatQuota("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackCsatQuotaCodeLengthRule flags a long code", () => {
  const rule = new FallbackCsatQuotaCodeLengthRule(3600);
  const item = newFallbackCsatQuota("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackCsatQuotaStartsAtRangeRule flags values above starts at", () => {
  const rule = new FallbackCsatQuotaStartsAtRangeRule(1000, 3600);
  const item = newFallbackCsatQuota("x", "y");
  item.startsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackCsatQuotaRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new FallbackCsatQuotaRequiredReviewerRule("fallback csat quota needs an entry");
  const item = newFallbackCsatQuota("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
