import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedConversionAuditCodeLengthRule,
  WeightedConversionAuditNameLengthRule,
  WeightedConversionAuditRequiredUnitRule,
  WeightedConversionAuditUnitLengthRule,
  defaultWeightedConversionAuditValidator,
} from "./weighted-conversion-audit-rules.js";
import { newWeightedConversionAudit } from "./weighted-conversion-audit.js";

test("WeightedConversionAuditValidator reports every problem", () => {
  const validator = defaultWeightedConversionAuditValidator();
  const item = newWeightedConversionAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedConversionAuditNameLengthRule flags a long name", () => {
  const rule = new WeightedConversionAuditNameLengthRule(64);
  const item = newWeightedConversionAudit("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedConversionAuditRequiredUnitRule flags a blank unit", () => {
  const rule = new WeightedConversionAuditRequiredUnitRule("weighted conversion audit needs this field");
  const item = newWeightedConversionAudit("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedConversionAuditUnitLengthRule flags a long unit", () => {
  const rule = new WeightedConversionAuditUnitLengthRule(120);
  const item = newWeightedConversionAudit("x", "y");
  item.unit = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedConversionAuditCodeLengthRule flags a long code", () => {
  const rule = new WeightedConversionAuditCodeLengthRule(16);
  const item = newWeightedConversionAudit("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
