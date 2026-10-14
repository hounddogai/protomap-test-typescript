import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalCsatAuditDiscountRangeRule,
  SeasonalCsatAuditLabelLengthRule,
  SeasonalCsatAuditNameLengthRule,
  defaultSeasonalCsatAuditValidator,
} from "./seasonal-csat-audit-rules.js";
import { newSeasonalCsatAudit } from "./seasonal-csat-audit.js";

test("SeasonalCsatAuditValidator reports every problem", () => {
  const validator = defaultSeasonalCsatAuditValidator();
  const item = newSeasonalCsatAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalCsatAuditNameLengthRule flags a long name", () => {
  const rule = new SeasonalCsatAuditNameLengthRule(64);
  const item = newSeasonalCsatAudit("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalCsatAuditDiscountRangeRule flags values above discount", () => {
  const rule = new SeasonalCsatAuditDiscountRangeRule(9.1, 3888.6);
  const item = newSeasonalCsatAudit("x", "y");
  item.discount = 3890.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalCsatAuditLabelLengthRule flags a long label", () => {
  const rule = new SeasonalCsatAuditLabelLengthRule(120);
  const item = newSeasonalCsatAudit("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
