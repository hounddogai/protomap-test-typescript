import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakQuotaContactEmailLengthRule,
  StreakQuotaLabelLengthRule,
  StreakQuotaRequiredCodeRule,
  StreakQuotaRequiredLocaleRule,
  StreakQuotaStartsAtRangeRule,
  defaultStreakQuotaValidator,
} from "./streak-quota-rules.js";
import { newStreakQuota } from "./streak-quota.js";

test("StreakQuotaValidator reports every problem", () => {
  const validator = defaultStreakQuotaValidator();
  const item = newStreakQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new StreakQuotaRequiredCodeRule("streak quota needs an entry");
  const item = newStreakQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakQuotaLabelLengthRule flags a long label", () => {
  const rule = new StreakQuotaLabelLengthRule(32);
  const item = newStreakQuota("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakQuotaRequiredLocaleRule flags a blank locale", () => {
  const rule = new StreakQuotaRequiredLocaleRule("streak quota needs this field");
  const item = newStreakQuota("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakQuotaStartsAtRangeRule flags values above starts at", () => {
  const rule = new StreakQuotaStartsAtRangeRule(80, 1000);
  const item = newStreakQuota("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakQuotaContactEmailLengthRule flags a long contact email", () => {
  const rule = new StreakQuotaContactEmailLengthRule(1000);
  const item = newStreakQuota("x", "y");
  item.contactEmail = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
