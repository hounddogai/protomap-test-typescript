import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackPlacementAuditCodeLengthRule,
  FallbackPlacementAuditLabelLengthRule,
  FallbackPlacementAuditRequiredCodeRule,
  FallbackPlacementAuditRequiredJourneyIdRule,
  FallbackPlacementAuditRequiredLabelRule,
  defaultFallbackPlacementAuditValidator,
} from "./fallback-placement-audit-rules.js";
import { newFallbackPlacementAudit } from "./fallback-placement-audit.js";

test("FallbackPlacementAuditValidator reports every problem", () => {
  const validator = defaultFallbackPlacementAuditValidator();
  const item = newFallbackPlacementAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackPlacementAuditRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new FallbackPlacementAuditRequiredJourneyIdRule("fallback placement audit needs this field");
  const item = newFallbackPlacementAudit("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackPlacementAuditLabelLengthRule flags a long label", () => {
  const rule = new FallbackPlacementAuditLabelLengthRule(3600);
  const item = newFallbackPlacementAudit("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackPlacementAuditRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackPlacementAuditRequiredLabelRule("fallback placement audit needs an entry");
  const item = newFallbackPlacementAudit("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackPlacementAuditRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackPlacementAuditRequiredCodeRule("fallback placement audit needs a value");
  const item = newFallbackPlacementAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackPlacementAuditCodeLengthRule flags a long code", () => {
  const rule = new FallbackPlacementAuditCodeLengthRule(3600);
  const item = newFallbackPlacementAudit("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
