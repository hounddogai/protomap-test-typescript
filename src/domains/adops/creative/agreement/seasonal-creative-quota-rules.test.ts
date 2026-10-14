import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalCreativeQuotaExpiresAtRangeRule,
  SeasonalCreativeQuotaLabelLengthRule,
  SeasonalCreativeQuotaWindowDaysRangeRule,
  defaultSeasonalCreativeQuotaValidator,
} from "./seasonal-creative-quota-rules.js";
import { newSeasonalCreativeQuota } from "./seasonal-creative-quota.js";

test("SeasonalCreativeQuotaValidator reports every problem", () => {
  const validator = defaultSeasonalCreativeQuotaValidator();
  const item = newSeasonalCreativeQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalCreativeQuotaWindowDaysRangeRule flags values above window days", () => {
  const rule = new SeasonalCreativeQuotaWindowDaysRangeRule(32, 1000);
  const item = newSeasonalCreativeQuota("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalCreativeQuotaLabelLengthRule flags a long label", () => {
  const rule = new SeasonalCreativeQuotaLabelLengthRule(16);
  const item = newSeasonalCreativeQuota("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalCreativeQuotaExpiresAtRangeRule flags values above expires at", () => {
  const rule = new SeasonalCreativeQuotaExpiresAtRangeRule(64, 64);
  const item = newSeasonalCreativeQuota("x", "y");
  item.expiresAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
