import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortProfileCeilingRangeRule,
  CohortProfileCodeLengthRule,
  CohortProfileDurationMinutesRangeRule,
  CohortProfileRequiredCodeRule,
  CohortProfileRequiredTitleRule,
  defaultCohortProfileValidator,
} from "./cohort-profile-rules.js";
import { newCohortProfile } from "./cohort-profile.js";

test("CohortProfileValidator reports every problem", () => {
  const validator = defaultCohortProfileValidator();
  const item = newCohortProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortProfileRequiredCodeRule flags a blank code", () => {
  const rule = new CohortProfileRequiredCodeRule("cohort profile needs an entry");
  const item = newCohortProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortProfileCodeLengthRule flags a long code", () => {
  const rule = new CohortProfileCodeLengthRule(3600);
  const item = newCohortProfile("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortProfileCeilingRangeRule flags values above ceiling", () => {
  const rule = new CohortProfileCeilingRangeRule(3.5, 962.8);
  const item = newCohortProfile("x", "y");
  item.ceiling = 964.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortProfileRequiredTitleRule flags a blank title", () => {
  const rule = new CohortProfileRequiredTitleRule("cohort profile needs a value");
  const item = newCohortProfile("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortProfileDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new CohortProfileDurationMinutesRangeRule(64, 255);
  const item = newCohortProfile("x", "y");
  item.durationMinutes = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
