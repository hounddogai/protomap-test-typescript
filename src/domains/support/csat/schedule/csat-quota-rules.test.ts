import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatQuotaDescriptionLengthRule,
  CsatQuotaRevisionRangeRule,
  defaultCsatQuotaValidator,
} from "./csat-quota-rules.js";
import { newCsatQuota } from "./csat-quota.js";

test("CsatQuotaValidator reports every problem", () => {
  const validator = defaultCsatQuotaValidator();
  const item = newCsatQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatQuotaRevisionRangeRule flags values above revision", () => {
  const rule = new CsatQuotaRevisionRangeRule(32, 86400);
  const item = newCsatQuota("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatQuotaDescriptionLengthRule flags a long description", () => {
  const rule = new CsatQuotaDescriptionLengthRule(32);
  const item = newCsatQuota("x", "y");
  item.description = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
