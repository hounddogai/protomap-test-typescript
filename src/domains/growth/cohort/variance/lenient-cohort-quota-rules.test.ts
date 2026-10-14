import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientCohortQuotaCodeLengthRule,
  LenientCohortQuotaLabelLengthRule,
  LenientCohortQuotaNameLengthRule,
  defaultLenientCohortQuotaValidator,
} from "./lenient-cohort-quota-rules.js";
import { newLenientCohortQuota } from "./lenient-cohort-quota.js";

test("LenientCohortQuotaValidator reports every problem", () => {
  const validator = defaultLenientCohortQuotaValidator();
  const item = newLenientCohortQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientCohortQuotaNameLengthRule flags a long name", () => {
  const rule = new LenientCohortQuotaNameLengthRule(80);
  const item = newLenientCohortQuota("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientCohortQuotaLabelLengthRule flags a long label", () => {
  const rule = new LenientCohortQuotaLabelLengthRule(120);
  const item = newLenientCohortQuota("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientCohortQuotaCodeLengthRule flags a long code", () => {
  const rule = new LenientCohortQuotaCodeLengthRule(86400);
  const item = newLenientCohortQuota("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
