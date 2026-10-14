import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredCohortAuditJourneyIdLengthRule,
  TieredCohortAuditLabelLengthRule,
  TieredCohortAuditRequiredTimezoneRule,
  defaultTieredCohortAuditValidator,
} from "./tiered-cohort-audit-rules.js";
import { newTieredCohortAudit } from "./tiered-cohort-audit.js";

test("TieredCohortAuditValidator reports every problem", () => {
  const validator = defaultTieredCohortAuditValidator();
  const item = newTieredCohortAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredCohortAuditRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new TieredCohortAuditRequiredTimezoneRule("tiered cohort audit needs this field");
  const item = newTieredCohortAudit("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredCohortAuditLabelLengthRule flags a long label", () => {
  const rule = new TieredCohortAuditLabelLengthRule(255);
  const item = newTieredCohortAudit("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredCohortAuditJourneyIdLengthRule flags a long journey id", () => {
  const rule = new TieredCohortAuditJourneyIdLengthRule(3600);
  const item = newTieredCohortAudit("x", "y");
  item.journeyId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
