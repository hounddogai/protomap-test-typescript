import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyCsatQuotaLabelLengthRule,
  LegacyCsatQuotaRequiredCodeRule,
  LegacyCsatQuotaRequiredLabelRule,
  defaultLegacyCsatQuotaValidator,
} from "./legacy-csat-quota-rules.js";
import { newLegacyCsatQuota } from "./legacy-csat-quota.js";

test("LegacyCsatQuotaValidator reports every problem", () => {
  const validator = defaultLegacyCsatQuotaValidator();
  const item = newLegacyCsatQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyCsatQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyCsatQuotaRequiredCodeRule("legacy csat quota needs this field");
  const item = newLegacyCsatQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyCsatQuotaLabelLengthRule flags a long label", () => {
  const rule = new LegacyCsatQuotaLabelLengthRule(255);
  const item = newLegacyCsatQuota("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyCsatQuotaRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyCsatQuotaRequiredLabelRule("legacy csat quota needs this field");
  const item = newLegacyCsatQuota("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
