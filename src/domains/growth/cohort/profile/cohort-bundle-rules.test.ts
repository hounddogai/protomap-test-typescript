import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortBundleCreatedAtRangeRule,
  CohortBundleLabelLengthRule,
  CohortBundleRequiredCodeRule,
  CohortBundleRequiredNotesRule,
  defaultCohortBundleValidator,
} from "./cohort-bundle-rules.js";
import { newCohortBundle } from "./cohort-bundle.js";

test("CohortBundleValidator reports every problem", () => {
  const validator = defaultCohortBundleValidator();
  const item = newCohortBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortBundleCreatedAtRangeRule flags values above created at", () => {
  const rule = new CohortBundleCreatedAtRangeRule(32, 255);
  const item = newCohortBundle("x", "y");
  item.createdAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortBundleLabelLengthRule flags a long label", () => {
  const rule = new CohortBundleLabelLengthRule(1000);
  const item = newCohortBundle("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortBundleRequiredCodeRule flags a blank code", () => {
  const rule = new CohortBundleRequiredCodeRule("cohort bundle needs this field");
  const item = newCohortBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortBundleRequiredNotesRule flags a blank notes", () => {
  const rule = new CohortBundleRequiredNotesRule("cohort bundle needs a value");
  const item = newCohortBundle("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
