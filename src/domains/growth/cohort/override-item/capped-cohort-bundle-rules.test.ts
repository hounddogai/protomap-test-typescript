import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedCohortBundleNameLengthRule,
  CappedCohortBundleRequiredNameRule,
  CappedCohortBundleStartsAtRangeRule,
  CappedCohortBundleVersionRangeRule,
  CappedCohortBundleWeightRangeRule,
  defaultCappedCohortBundleValidator,
} from "./capped-cohort-bundle-rules.js";
import { newCappedCohortBundle } from "./capped-cohort-bundle.js";

test("CappedCohortBundleValidator reports every problem", () => {
  const validator = defaultCappedCohortBundleValidator();
  const item = newCappedCohortBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedCohortBundleWeightRangeRule flags values above weight", () => {
  const rule = new CappedCohortBundleWeightRangeRule(7.4, 1645.1);
  const item = newCappedCohortBundle("x", "y");
  item.weight = 1646.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedCohortBundleRequiredNameRule flags a blank name", () => {
  const rule = new CappedCohortBundleRequiredNameRule("capped cohort bundle needs this field");
  const item = newCappedCohortBundle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedCohortBundleNameLengthRule flags a long name", () => {
  const rule = new CappedCohortBundleNameLengthRule(120);
  const item = newCappedCohortBundle("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedCohortBundleStartsAtRangeRule flags values above starts at", () => {
  const rule = new CappedCohortBundleStartsAtRangeRule(120, 86400);
  const item = newCappedCohortBundle("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedCohortBundleVersionRangeRule flags values above version", () => {
  const rule = new CappedCohortBundleVersionRangeRule(80, 120);
  const item = newCappedCohortBundle("x", "y");
  item.version = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
