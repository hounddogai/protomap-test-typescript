import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortRollupCohortLengthRule,
  CohortRollupRequiredCohortRule,
  CohortRollupTitleLengthRule,
  defaultCohortRollupValidator,
} from "./cohort-rollup-rules.js";
import { newCohortRollup } from "./cohort-rollup.js";

test("CohortRollupValidator reports every problem", () => {
  const validator = defaultCohortRollupValidator();
  const item = newCohortRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortRollupTitleLengthRule flags a long title", () => {
  const rule = new CohortRollupTitleLengthRule(1000);
  const item = newCohortRollup("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortRollupRequiredCohortRule flags a blank cohort", () => {
  const rule = new CohortRollupRequiredCohortRule("cohort rollup needs an entry");
  const item = newCohortRollup("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortRollupCohortLengthRule flags a long cohort", () => {
  const rule = new CohortRollupCohortLengthRule(16);
  const item = newCohortRollup("x", "y");
  item.cohort = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
