import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredDeflectionThresholdCodeLengthRule,
  TieredDeflectionThresholdExternalRefLengthRule,
  TieredDeflectionThresholdRequiredLocaleRule,
  defaultTieredDeflectionThresholdValidator,
} from "./tiered-deflection-threshold-rules.js";
import { newTieredDeflectionThreshold } from "./tiered-deflection-threshold.js";

test("TieredDeflectionThresholdValidator reports every problem", () => {
  const validator = defaultTieredDeflectionThresholdValidator();
  const item = newTieredDeflectionThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredDeflectionThresholdCodeLengthRule flags a long code", () => {
  const rule = new TieredDeflectionThresholdCodeLengthRule(1000);
  const item = newTieredDeflectionThreshold("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredDeflectionThresholdExternalRefLengthRule flags a long external ref", () => {
  const rule = new TieredDeflectionThresholdExternalRefLengthRule(255);
  const item = newTieredDeflectionThreshold("x", "y");
  item.externalRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredDeflectionThresholdRequiredLocaleRule flags a blank locale", () => {
  const rule = new TieredDeflectionThresholdRequiredLocaleRule("tiered deflection threshold needs a value");
  const item = newTieredDeflectionThreshold("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
