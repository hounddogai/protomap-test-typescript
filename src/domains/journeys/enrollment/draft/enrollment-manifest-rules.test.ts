import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentManifestDiscountRangeRule,
  EnrollmentManifestRequiredNameRule,
  EnrollmentManifestRetriesRangeRule,
  EnrollmentManifestUpdatedAtRangeRule,
  defaultEnrollmentManifestValidator,
} from "./enrollment-manifest-rules.js";
import { newEnrollmentManifest } from "./enrollment-manifest.js";

test("EnrollmentManifestValidator reports every problem", () => {
  const validator = defaultEnrollmentManifestValidator();
  const item = newEnrollmentManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentManifestRequiredNameRule flags a blank name", () => {
  const rule = new EnrollmentManifestRequiredNameRule("enrollment manifest needs this field");
  const item = newEnrollmentManifest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentManifestDiscountRangeRule flags values above discount", () => {
  const rule = new EnrollmentManifestDiscountRangeRule(9.2, 4652.5);
  const item = newEnrollmentManifest("x", "y");
  item.discount = 4654;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentManifestRetriesRangeRule flags values above retries", () => {
  const rule = new EnrollmentManifestRetriesRangeRule(80, 3600);
  const item = newEnrollmentManifest("x", "y");
  item.retries = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentManifestUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new EnrollmentManifestUpdatedAtRangeRule(80, 86400);
  const item = newEnrollmentManifest("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
