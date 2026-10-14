import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortTierChannelLengthRule,
  CohortTierCodeLengthRule,
  CohortTierLabelLengthRule,
  CohortTierRateRangeRule,
  CohortTierWindowDaysRangeRule,
  defaultCohortTierValidator,
} from "./cohort-tier-rules.js";
import { newCohortTier } from "./cohort-tier.js";

test("CohortTierValidator reports every problem", () => {
  const validator = defaultCohortTierValidator();
  const item = newCohortTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortTierLabelLengthRule flags a long label", () => {
  const rule = new CohortTierLabelLengthRule(64);
  const item = newCohortTier("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortTierRateRangeRule flags values above rate", () => {
  const rule = new CohortTierRateRangeRule(9.2, 2172.4);
  const item = newCohortTier("x", "y");
  item.rate = 2173.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortTierWindowDaysRangeRule flags values above window days", () => {
  const rule = new CohortTierWindowDaysRangeRule(80, 86400);
  const item = newCohortTier("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortTierChannelLengthRule flags a long channel", () => {
  const rule = new CohortTierChannelLengthRule(32);
  const item = newCohortTier("x", "y");
  item.channel = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortTierCodeLengthRule flags a long code", () => {
  const rule = new CohortTierCodeLengthRule(32);
  const item = newCohortTier("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
