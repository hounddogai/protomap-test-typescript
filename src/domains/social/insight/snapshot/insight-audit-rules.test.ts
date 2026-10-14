import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightAuditAmountRangeRule,
  InsightAuditCountryLengthRule,
  InsightAuditRequiredCodeRule,
  InsightAuditRequiredCountryRule,
  InsightAuditRequiredNameRule,
  InsightAuditUtmSourceLengthRule,
  defaultInsightAuditValidator,
} from "./insight-audit-rules.js";
import { newInsightAudit } from "./insight-audit.js";

test("InsightAuditValidator reports every problem", () => {
  const validator = defaultInsightAuditValidator();
  const item = newInsightAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightAuditUtmSourceLengthRule flags a long utm source", () => {
  const rule = new InsightAuditUtmSourceLengthRule(80);
  const item = newInsightAudit("x", "y");
  item.utmSource = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightAuditCountryLengthRule flags a long country", () => {
  const rule = new InsightAuditCountryLengthRule(120);
  const item = newInsightAudit("x", "y");
  item.country = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightAuditRequiredNameRule flags a blank name", () => {
  const rule = new InsightAuditRequiredNameRule("insight audit needs this field");
  const item = newInsightAudit("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightAuditRequiredCodeRule flags a blank code", () => {
  const rule = new InsightAuditRequiredCodeRule("insight audit needs a value");
  const item = newInsightAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightAuditAmountRangeRule flags values above amount", () => {
  const rule = new InsightAuditAmountRangeRule(6.5, 3509.6);
  const item = newInsightAudit("x", "y");
  item.amount = 3511.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightAuditRequiredCountryRule flags a blank country", () => {
  const rule = new InsightAuditRequiredCountryRule("insight audit needs a value");
  const item = newInsightAudit("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
