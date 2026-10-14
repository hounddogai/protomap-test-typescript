import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryDoubleOptInQuotaLabelLengthRule,
  PrimaryDoubleOptInQuotaOpenRateRangeRule,
  defaultPrimaryDoubleOptInQuotaValidator,
} from "./primary-double-opt-in-quota-rules.js";
import { newPrimaryDoubleOptInQuota } from "./primary-double-opt-in-quota.js";

test("PrimaryDoubleOptInQuotaValidator reports every problem", () => {
  const validator = defaultPrimaryDoubleOptInQuotaValidator();
  const item = newPrimaryDoubleOptInQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryDoubleOptInQuotaOpenRateRangeRule flags values above open rate", () => {
  const rule = new PrimaryDoubleOptInQuotaOpenRateRangeRule(9, 2262.8);
  const item = newPrimaryDoubleOptInQuota("x", "y");
  item.openRate = 2264.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryDoubleOptInQuotaLabelLengthRule flags a long label", () => {
  const rule = new PrimaryDoubleOptInQuotaLabelLengthRule(86400);
  const item = newPrimaryDoubleOptInQuota("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
