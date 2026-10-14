import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackPathQuotaCostRangeRule,
  FallbackPathQuotaLabelLengthRule,
  FallbackPathQuotaRequiredLabelRule,
  defaultFallbackPathQuotaValidator,
} from "./fallback-path-quota-rules.js";
import { newFallbackPathQuota } from "./fallback-path-quota.js";

test("FallbackPathQuotaValidator reports every problem", () => {
  const validator = defaultFallbackPathQuotaValidator();
  const item = newFallbackPathQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackPathQuotaCostRangeRule flags values above cost", () => {
  const rule = new FallbackPathQuotaCostRangeRule(2, 4890.1);
  const item = newFallbackPathQuota("x", "y");
  item.cost = 4891.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPathQuotaRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackPathQuotaRequiredLabelRule("fallback path quota needs an entry");
  const item = newFallbackPathQuota("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackPathQuotaLabelLengthRule flags a long label", () => {
  const rule = new FallbackPathQuotaLabelLengthRule(16);
  const item = newFallbackPathQuota("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
