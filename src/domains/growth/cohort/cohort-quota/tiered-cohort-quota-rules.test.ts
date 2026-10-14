import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredCohortQuotaCostRangeRule,
  TieredCohortQuotaEndsAtRangeRule,
  TieredCohortQuotaRequiredTitleRule,
  TieredCohortQuotaSummaryLengthRule,
  TieredCohortQuotaTitleLengthRule,
  defaultTieredCohortQuotaValidator,
} from "./tiered-cohort-quota-rules.js";
import { newTieredCohortQuota } from "./tiered-cohort-quota.js";

test("TieredCohortQuotaValidator reports every problem", () => {
  const validator = defaultTieredCohortQuotaValidator();
  const item = newTieredCohortQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredCohortQuotaCostRangeRule flags values above cost", () => {
  const rule = new TieredCohortQuotaCostRangeRule(0.1, 2266.1);
  const item = newTieredCohortQuota("x", "y");
  item.cost = 2267.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredCohortQuotaEndsAtRangeRule flags values above ends at", () => {
  const rule = new TieredCohortQuotaEndsAtRangeRule(16, 120);
  const item = newTieredCohortQuota("x", "y");
  item.endsAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredCohortQuotaRequiredTitleRule flags a blank title", () => {
  const rule = new TieredCohortQuotaRequiredTitleRule("tiered cohort quota needs an entry");
  const item = newTieredCohortQuota("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredCohortQuotaSummaryLengthRule flags a long summary", () => {
  const rule = new TieredCohortQuotaSummaryLengthRule(32);
  const item = newTieredCohortQuota("x", "y");
  item.summary = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredCohortQuotaTitleLengthRule flags a long title", () => {
  const rule = new TieredCohortQuotaTitleLengthRule(120);
  const item = newTieredCohortQuota("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
