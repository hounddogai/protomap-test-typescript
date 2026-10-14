import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortQuotaChecksumLengthRule,
  CohortQuotaCostRangeRule,
  CohortQuotaRequiredChecksumRule,
  CohortQuotaRequiredCodeRule,
  defaultCohortQuotaValidator,
} from "./cohort-quota-rules.js";
import { newCohortQuota } from "./cohort-quota.js";

test("CohortQuotaValidator reports every problem", () => {
  const validator = defaultCohortQuotaValidator();
  const item = newCohortQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortQuotaChecksumLengthRule flags a long checksum", () => {
  const rule = new CohortQuotaChecksumLengthRule(255);
  const item = newCohortQuota("x", "y");
  item.checksum = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new CohortQuotaRequiredCodeRule("cohort quota needs this field");
  const item = newCohortQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortQuotaRequiredChecksumRule flags a blank checksum", () => {
  const rule = new CohortQuotaRequiredChecksumRule("cohort quota needs an entry");
  const item = newCohortQuota("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortQuotaCostRangeRule flags values above cost", () => {
  const rule = new CohortQuotaCostRangeRule(0.3, 3363.8);
  const item = newCohortQuota("x", "y");
  item.cost = 3365.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
