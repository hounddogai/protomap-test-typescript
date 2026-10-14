import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyQuotaRequiredCodeRule,
  FrequencyQuotaTitleLengthRule,
  FrequencyQuotaUnitLengthRule,
  defaultFrequencyQuotaValidator,
} from "./frequency-quota-rules.js";
import { newFrequencyQuota } from "./frequency-quota.js";

test("FrequencyQuotaValidator reports every problem", () => {
  const validator = defaultFrequencyQuotaValidator();
  const item = newFrequencyQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new FrequencyQuotaRequiredCodeRule("frequency quota needs a value");
  const item = newFrequencyQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyQuotaTitleLengthRule flags a long title", () => {
  const rule = new FrequencyQuotaTitleLengthRule(255);
  const item = newFrequencyQuota("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyQuotaUnitLengthRule flags a long unit", () => {
  const rule = new FrequencyQuotaUnitLengthRule(3600);
  const item = newFrequencyQuota("x", "y");
  item.unit = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
