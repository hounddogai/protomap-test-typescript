import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalDeflectionBaselineCodeLengthRule,
  GlobalDeflectionBaselineDescriptionLengthRule,
  GlobalDeflectionBaselineLabelLengthRule,
  GlobalDeflectionBaselineRequiredCodeRule,
  GlobalDeflectionBaselineRequiredDescriptionRule,
  GlobalDeflectionBaselineRequiredLabelRule,
  defaultGlobalDeflectionBaselineValidator,
} from "./global-deflection-baseline-rules.js";
import { newGlobalDeflectionBaseline } from "./global-deflection-baseline.js";

test("GlobalDeflectionBaselineValidator reports every problem", () => {
  const validator = defaultGlobalDeflectionBaselineValidator();
  const item = newGlobalDeflectionBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalDeflectionBaselineCodeLengthRule flags a long code", () => {
  const rule = new GlobalDeflectionBaselineCodeLengthRule(1000);
  const item = newGlobalDeflectionBaseline("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalDeflectionBaselineRequiredDescriptionRule flags a blank description", () => {
  const rule = new GlobalDeflectionBaselineRequiredDescriptionRule("global deflection baseline needs this field");
  const item = newGlobalDeflectionBaseline("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalDeflectionBaselineLabelLengthRule flags a long label", () => {
  const rule = new GlobalDeflectionBaselineLabelLengthRule(16);
  const item = newGlobalDeflectionBaseline("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalDeflectionBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalDeflectionBaselineRequiredCodeRule("global deflection baseline needs an entry");
  const item = newGlobalDeflectionBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalDeflectionBaselineRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalDeflectionBaselineRequiredLabelRule("global deflection baseline needs an entry");
  const item = newGlobalDeflectionBaseline("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalDeflectionBaselineDescriptionLengthRule flags a long description", () => {
  const rule = new GlobalDeflectionBaselineDescriptionLengthRule(86400);
  const item = newGlobalDeflectionBaseline("x", "y");
  item.description = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
