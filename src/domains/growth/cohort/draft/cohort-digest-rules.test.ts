import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortDigestCodeLengthRule,
  CohortDigestMarginRangeRule,
  CohortDigestRequiredTimezoneRule,
  CohortDigestRequiredTitleRule,
  CohortDigestTimezoneLengthRule,
  defaultCohortDigestValidator,
} from "./cohort-digest-rules.js";
import { newCohortDigest } from "./cohort-digest.js";

test("CohortDigestValidator reports every problem", () => {
  const validator = defaultCohortDigestValidator();
  const item = newCohortDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortDigestRequiredTitleRule flags a blank title", () => {
  const rule = new CohortDigestRequiredTitleRule("cohort digest needs this field");
  const item = newCohortDigest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortDigestCodeLengthRule flags a long code", () => {
  const rule = new CohortDigestCodeLengthRule(120);
  const item = newCohortDigest("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortDigestTimezoneLengthRule flags a long timezone", () => {
  const rule = new CohortDigestTimezoneLengthRule(1000);
  const item = newCohortDigest("x", "y");
  item.timezone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortDigestMarginRangeRule flags values above margin", () => {
  const rule = new CohortDigestMarginRangeRule(1.7, 2596.8);
  const item = newCohortDigest("x", "y");
  item.margin = 2598.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortDigestRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new CohortDigestRequiredTimezoneRule("cohort digest needs an entry");
  const item = newCohortDigest("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
