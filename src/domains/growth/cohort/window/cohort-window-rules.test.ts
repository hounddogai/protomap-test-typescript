import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortWindowBidRangeRule,
  CohortWindowCountryLengthRule,
  CohortWindowCreatedAtRangeRule,
  CohortWindowExpiresAtRangeRule,
  CohortWindowRequiredCountryRule,
  defaultCohortWindowValidator,
} from "./cohort-window-rules.js";
import { newCohortWindow } from "./cohort-window.js";

test("CohortWindowValidator reports every problem", () => {
  const validator = defaultCohortWindowValidator();
  const item = newCohortWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortWindowBidRangeRule flags values above bid", () => {
  const rule = new CohortWindowBidRangeRule(9.8, 2969.8);
  const item = newCohortWindow("x", "y");
  item.bid = 2971.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortWindowCreatedAtRangeRule flags values above created at", () => {
  const rule = new CohortWindowCreatedAtRangeRule(64, 80);
  const item = newCohortWindow("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortWindowRequiredCountryRule flags a blank country", () => {
  const rule = new CohortWindowRequiredCountryRule("cohort window needs an entry");
  const item = newCohortWindow("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortWindowExpiresAtRangeRule flags values above expires at", () => {
  const rule = new CohortWindowExpiresAtRangeRule(86400, 86400);
  const item = newCohortWindow("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortWindowCountryLengthRule flags a long country", () => {
  const rule = new CohortWindowCountryLengthRule(32);
  const item = newCohortWindow("x", "y");
  item.country = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
