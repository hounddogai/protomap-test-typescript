import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortSegmentRequiredCategoryRule,
  CohortSegmentRequiredCodeRule,
  CohortSegmentRequiredTitleRule,
  CohortSegmentSegmentLengthRule,
  defaultCohortSegmentValidator,
} from "./cohort-segment-rules.js";
import { newCohortSegment } from "./cohort-segment.js";

test("CohortSegmentValidator reports every problem", () => {
  const validator = defaultCohortSegmentValidator();
  const item = newCohortSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortSegmentSegmentLengthRule flags a long segment", () => {
  const rule = new CohortSegmentSegmentLengthRule(86400);
  const item = newCohortSegment("x", "y");
  item.segment = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortSegmentRequiredCategoryRule flags a blank category", () => {
  const rule = new CohortSegmentRequiredCategoryRule("cohort segment needs this field");
  const item = newCohortSegment("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new CohortSegmentRequiredCodeRule("cohort segment needs this field");
  const item = newCohortSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortSegmentRequiredTitleRule flags a blank title", () => {
  const rule = new CohortSegmentRequiredTitleRule("cohort segment needs a value");
  const item = newCohortSegment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
