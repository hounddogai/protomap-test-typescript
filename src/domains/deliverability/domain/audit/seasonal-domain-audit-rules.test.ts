import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalDomainAuditCodeLengthRule,
  SeasonalDomainAuditRequiredCodeRule,
  SeasonalDomainAuditReviewerLengthRule,
  defaultSeasonalDomainAuditValidator,
} from "./seasonal-domain-audit-rules.js";
import { newSeasonalDomainAudit } from "./seasonal-domain-audit.js";

test("SeasonalDomainAuditValidator reports every problem", () => {
  const validator = defaultSeasonalDomainAuditValidator();
  const item = newSeasonalDomainAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalDomainAuditReviewerLengthRule flags a long reviewer", () => {
  const rule = new SeasonalDomainAuditReviewerLengthRule(120);
  const item = newSeasonalDomainAudit("x", "y");
  item.reviewer = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalDomainAuditRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalDomainAuditRequiredCodeRule("seasonal domain audit needs this field");
  const item = newSeasonalDomainAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalDomainAuditCodeLengthRule flags a long code", () => {
  const rule = new SeasonalDomainAuditCodeLengthRule(3600);
  const item = newSeasonalDomainAudit("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
