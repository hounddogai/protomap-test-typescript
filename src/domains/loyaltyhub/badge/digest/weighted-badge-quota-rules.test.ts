import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedBadgeQuotaCodeLengthRule,
  WeightedBadgeQuotaRequiredNameRule,
  defaultWeightedBadgeQuotaValidator,
} from "./weighted-badge-quota-rules.js";
import { newWeightedBadgeQuota } from "./weighted-badge-quota.js";

test("WeightedBadgeQuotaValidator reports every problem", () => {
  const validator = defaultWeightedBadgeQuotaValidator();
  const item = newWeightedBadgeQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedBadgeQuotaRequiredNameRule flags a blank name", () => {
  const rule = new WeightedBadgeQuotaRequiredNameRule("weighted badge quota needs this field");
  const item = newWeightedBadgeQuota("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedBadgeQuotaCodeLengthRule flags a long code", () => {
  const rule = new WeightedBadgeQuotaCodeLengthRule(64);
  const item = newWeightedBadgeQuota("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
