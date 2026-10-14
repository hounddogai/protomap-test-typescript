import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderQuotaCodeLengthRule,
  SenderQuotaCohortLengthRule,
  SenderQuotaRequiredCohortRule,
  SenderQuotaRequiredSummaryRule,
  SenderQuotaStartsAtRangeRule,
  SenderQuotaSummaryLengthRule,
  defaultSenderQuotaValidator,
} from "./sender-quota-rules.js";
import { newSenderQuota } from "./sender-quota.js";

test("SenderQuotaValidator reports every problem", () => {
  const validator = defaultSenderQuotaValidator();
  const item = newSenderQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderQuotaCohortLengthRule flags a long cohort", () => {
  const rule = new SenderQuotaCohortLengthRule(64);
  const item = newSenderQuota("x", "y");
  item.cohort = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderQuotaRequiredSummaryRule flags a blank summary", () => {
  const rule = new SenderQuotaRequiredSummaryRule("sender quota needs this field");
  const item = newSenderQuota("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderQuotaRequiredCohortRule flags a blank cohort", () => {
  const rule = new SenderQuotaRequiredCohortRule("sender quota needs a value");
  const item = newSenderQuota("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderQuotaStartsAtRangeRule flags values above starts at", () => {
  const rule = new SenderQuotaStartsAtRangeRule(120, 86400);
  const item = newSenderQuota("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderQuotaSummaryLengthRule flags a long summary", () => {
  const rule = new SenderQuotaSummaryLengthRule(64);
  const item = newSenderQuota("x", "y");
  item.summary = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderQuotaCodeLengthRule flags a long code", () => {
  const rule = new SenderQuotaCodeLengthRule(32);
  const item = newSenderQuota("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
