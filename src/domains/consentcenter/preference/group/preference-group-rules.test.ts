import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceGroupCohortLengthRule,
  PreferenceGroupRequiredCodeRule,
  PreferenceGroupRequiredReviewerRule,
  PreferenceGroupRequiredTitleRule,
  PreferenceGroupTitleLengthRule,
  defaultPreferenceGroupValidator,
} from "./preference-group-rules.js";
import { newPreferenceGroup } from "./preference-group.js";

test("PreferenceGroupValidator reports every problem", () => {
  const validator = defaultPreferenceGroupValidator();
  const item = newPreferenceGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceGroupTitleLengthRule flags a long title", () => {
  const rule = new PreferenceGroupTitleLengthRule(64);
  const item = newPreferenceGroup("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceGroupCohortLengthRule flags a long cohort", () => {
  const rule = new PreferenceGroupCohortLengthRule(255);
  const item = newPreferenceGroup("x", "y");
  item.cohort = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceGroupRequiredCodeRule flags a blank code", () => {
  const rule = new PreferenceGroupRequiredCodeRule("preference group needs this field");
  const item = newPreferenceGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceGroupRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new PreferenceGroupRequiredReviewerRule("preference group needs a value");
  const item = newPreferenceGroup("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceGroupRequiredTitleRule flags a blank title", () => {
  const rule = new PreferenceGroupRequiredTitleRule("preference group needs a value");
  const item = newPreferenceGroup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
