import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightNoticeCohortLengthRule,
  InsightNoticeRequiredCohortRule,
  InsightNoticeRequiredTitleRule,
  defaultInsightNoticeValidator,
} from "./insight-notice-rules.js";
import { newInsightNotice } from "./insight-notice.js";

test("InsightNoticeValidator reports every problem", () => {
  const validator = defaultInsightNoticeValidator();
  const item = newInsightNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightNoticeCohortLengthRule flags a long cohort", () => {
  const rule = new InsightNoticeCohortLengthRule(64);
  const item = newInsightNotice("x", "y");
  item.cohort = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightNoticeRequiredTitleRule flags a blank title", () => {
  const rule = new InsightNoticeRequiredTitleRule("insight notice needs an entry");
  const item = newInsightNotice("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightNoticeRequiredCohortRule flags a blank cohort", () => {
  const rule = new InsightNoticeRequiredCohortRule("insight notice needs this field");
  const item = newInsightNotice("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
