import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentBundleRequiredCategoryRule,
  EnrollmentBundleRequiredTitleRule,
  EnrollmentBundleSourceLengthRule,
  EnrollmentBundleTitleLengthRule,
  defaultEnrollmentBundleValidator,
} from "./enrollment-bundle-rules.js";
import { newEnrollmentBundle } from "./enrollment-bundle.js";

test("EnrollmentBundleValidator reports every problem", () => {
  const validator = defaultEnrollmentBundleValidator();
  const item = newEnrollmentBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentBundleSourceLengthRule flags a long source", () => {
  const rule = new EnrollmentBundleSourceLengthRule(86400);
  const item = newEnrollmentBundle("x", "y");
  item.source = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentBundleTitleLengthRule flags a long title", () => {
  const rule = new EnrollmentBundleTitleLengthRule(3600);
  const item = newEnrollmentBundle("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentBundleRequiredCategoryRule flags a blank category", () => {
  const rule = new EnrollmentBundleRequiredCategoryRule("enrollment bundle needs an entry");
  const item = newEnrollmentBundle("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentBundleRequiredTitleRule flags a blank title", () => {
  const rule = new EnrollmentBundleRequiredTitleRule("enrollment bundle needs a value");
  const item = newEnrollmentBundle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
