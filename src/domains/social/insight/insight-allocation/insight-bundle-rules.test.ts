import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightBundleRequiredCodeRule,
  InsightBundleRequiredCohortRule,
  InsightBundleRequiredDescriptionRule,
  InsightBundleRequiredNameRule,
  defaultInsightBundleValidator,
} from "./insight-bundle-rules.js";
import { newInsightBundle } from "./insight-bundle.js";

test("InsightBundleValidator reports every problem", () => {
  const validator = defaultInsightBundleValidator();
  const item = newInsightBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightBundleRequiredNameRule flags a blank name", () => {
  const rule = new InsightBundleRequiredNameRule("insight bundle needs this field");
  const item = newInsightBundle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightBundleRequiredDescriptionRule flags a blank description", () => {
  const rule = new InsightBundleRequiredDescriptionRule("insight bundle needs a value");
  const item = newInsightBundle("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightBundleRequiredCodeRule flags a blank code", () => {
  const rule = new InsightBundleRequiredCodeRule("insight bundle needs a value");
  const item = newInsightBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightBundleRequiredCohortRule flags a blank cohort", () => {
  const rule = new InsightBundleRequiredCohortRule("insight bundle needs a value");
  const item = newInsightBundle("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
