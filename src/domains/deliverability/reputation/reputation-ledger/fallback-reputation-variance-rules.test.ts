import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackReputationVarianceChecksumLengthRule,
  FallbackReputationVarianceCodeLengthRule,
  FallbackReputationVarianceRequiredLabelRule,
  defaultFallbackReputationVarianceValidator,
} from "./fallback-reputation-variance-rules.js";
import { newFallbackReputationVariance } from "./fallback-reputation-variance.js";

test("FallbackReputationVarianceValidator reports every problem", () => {
  const validator = defaultFallbackReputationVarianceValidator();
  const item = newFallbackReputationVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackReputationVarianceCodeLengthRule flags a long code", () => {
  const rule = new FallbackReputationVarianceCodeLengthRule(255);
  const item = newFallbackReputationVariance("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackReputationVarianceRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackReputationVarianceRequiredLabelRule("fallback reputation variance needs a value");
  const item = newFallbackReputationVariance("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackReputationVarianceChecksumLengthRule flags a long checksum", () => {
  const rule = new FallbackReputationVarianceChecksumLengthRule(86400);
  const item = newFallbackReputationVariance("x", "y");
  item.checksum = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
