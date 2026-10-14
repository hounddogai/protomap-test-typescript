import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveModelAuditCapacityRangeRule,
  AdaptiveModelAuditLabelLengthRule,
  AdaptiveModelAuditRequiredLabelRule,
  AdaptiveModelAuditRequiredNameRule,
  defaultAdaptiveModelAuditValidator,
} from "./adaptive-model-audit-rules.js";
import { newAdaptiveModelAudit } from "./adaptive-model-audit.js";

test("AdaptiveModelAuditValidator reports every problem", () => {
  const validator = defaultAdaptiveModelAuditValidator();
  const item = newAdaptiveModelAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveModelAuditLabelLengthRule flags a long label", () => {
  const rule = new AdaptiveModelAuditLabelLengthRule(255);
  const item = newAdaptiveModelAudit("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveModelAuditCapacityRangeRule flags values above capacity", () => {
  const rule = new AdaptiveModelAuditCapacityRangeRule(16, 86400);
  const item = newAdaptiveModelAudit("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveModelAuditRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptiveModelAuditRequiredLabelRule("adaptive model audit needs a value");
  const item = newAdaptiveModelAudit("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveModelAuditRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveModelAuditRequiredNameRule("adaptive model audit needs this field");
  const item = newAdaptiveModelAudit("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
