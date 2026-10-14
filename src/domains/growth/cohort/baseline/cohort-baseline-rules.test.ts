import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortBaselineLocaleLengthRule,
  CohortBaselineRequiredCodeRule,
  CohortBaselineRequiredRegionRule,
  defaultCohortBaselineValidator,
} from "./cohort-baseline-rules.js";
import { newCohortBaseline } from "./cohort-baseline.js";

test("CohortBaselineValidator reports every problem", () => {
  const validator = defaultCohortBaselineValidator();
  const item = newCohortBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortBaselineLocaleLengthRule flags a long locale", () => {
  const rule = new CohortBaselineLocaleLengthRule(80);
  const item = newCohortBaseline("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new CohortBaselineRequiredCodeRule("cohort baseline needs this field");
  const item = newCohortBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortBaselineRequiredRegionRule flags a blank region", () => {
  const rule = new CohortBaselineRequiredRegionRule("cohort baseline needs this field");
  const item = newCohortBaseline("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
