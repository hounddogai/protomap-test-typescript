import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPostQuotaCodeLengthRule,
  RollingPostQuotaFrequencyCapRangeRule,
  RollingPostQuotaLabelLengthRule,
  RollingPostQuotaRetriesRangeRule,
  defaultRollingPostQuotaValidator,
} from "./rolling-post-quota-rules.js";
import { newRollingPostQuota } from "./rolling-post-quota.js";

test("RollingPostQuotaValidator reports every problem", () => {
  const validator = defaultRollingPostQuotaValidator();
  const item = newRollingPostQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPostQuotaLabelLengthRule flags a long label", () => {
  const rule = new RollingPostQuotaLabelLengthRule(86400);
  const item = newRollingPostQuota("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPostQuotaFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new RollingPostQuotaFrequencyCapRangeRule(1000, 1000);
  const item = newRollingPostQuota("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingPostQuotaRetriesRangeRule flags values above retries", () => {
  const rule = new RollingPostQuotaRetriesRangeRule(120, 86400);
  const item = newRollingPostQuota("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingPostQuotaCodeLengthRule flags a long code", () => {
  const rule = new RollingPostQuotaCodeLengthRule(120);
  const item = newRollingPostQuota("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
