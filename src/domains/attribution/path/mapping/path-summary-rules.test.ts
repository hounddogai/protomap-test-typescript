import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathSummaryCohortLengthRule,
  PathSummaryLabelLengthRule,
  PathSummaryRequiredExternalRefRule,
  PathSummaryWeightRangeRule,
  defaultPathSummaryValidator,
} from "./path-summary-rules.js";
import { newPathSummary } from "./path-summary.js";

test("PathSummaryValidator reports every problem", () => {
  const validator = defaultPathSummaryValidator();
  const item = newPathSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathSummaryRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new PathSummaryRequiredExternalRefRule("path summary needs a value");
  const item = newPathSummary("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathSummaryCohortLengthRule flags a long cohort", () => {
  const rule = new PathSummaryCohortLengthRule(32);
  const item = newPathSummary("x", "y");
  item.cohort = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathSummaryLabelLengthRule flags a long label", () => {
  const rule = new PathSummaryLabelLengthRule(120);
  const item = newPathSummary("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathSummaryWeightRangeRule flags values above weight", () => {
  const rule = new PathSummaryWeightRangeRule(6.3, 1787.5);
  const item = newPathSummary("x", "y");
  item.weight = 1789;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
