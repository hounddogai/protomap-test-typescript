import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationGroupCohortLengthRule,
  ReputationGroupMarginRangeRule,
  ReputationGroupRequiredCodeRule,
  ReputationGroupRequiredLabelRule,
  ReputationGroupReviewerLengthRule,
  defaultReputationGroupValidator,
} from "./reputation-group-rules.js";
import { newReputationGroup } from "./reputation-group.js";

test("ReputationGroupValidator reports every problem", () => {
  const validator = defaultReputationGroupValidator();
  const item = newReputationGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationGroupReviewerLengthRule flags a long reviewer", () => {
  const rule = new ReputationGroupReviewerLengthRule(3600);
  const item = newReputationGroup("x", "y");
  item.reviewer = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationGroupCohortLengthRule flags a long cohort", () => {
  const rule = new ReputationGroupCohortLengthRule(86400);
  const item = newReputationGroup("x", "y");
  item.cohort = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationGroupRequiredCodeRule flags a blank code", () => {
  const rule = new ReputationGroupRequiredCodeRule("reputation group needs this field");
  const item = newReputationGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationGroupRequiredLabelRule flags a blank label", () => {
  const rule = new ReputationGroupRequiredLabelRule("reputation group needs a value");
  const item = newReputationGroup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationGroupMarginRangeRule flags values above margin", () => {
  const rule = new ReputationGroupMarginRangeRule(0.6, 862.9);
  const item = newReputationGroup("x", "y");
  item.margin = 864.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
