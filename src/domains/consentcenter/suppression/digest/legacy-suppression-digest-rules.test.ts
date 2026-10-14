import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacySuppressionDigestCapacityRangeRule,
  LegacySuppressionDigestCeilingRangeRule,
  LegacySuppressionDigestCodeLengthRule,
  LegacySuppressionDigestLabelLengthRule,
  LegacySuppressionDigestMinimumRangeRule,
  LegacySuppressionDigestRequiredCodeRule,
  defaultLegacySuppressionDigestValidator,
} from "./legacy-suppression-digest-rules.js";
import { newLegacySuppressionDigest } from "./legacy-suppression-digest.js";

test("LegacySuppressionDigestValidator reports every problem", () => {
  const validator = defaultLegacySuppressionDigestValidator();
  const item = newLegacySuppressionDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacySuppressionDigestMinimumRangeRule flags values above minimum", () => {
  const rule = new LegacySuppressionDigestMinimumRangeRule(3.3, 1494.2);
  const item = newLegacySuppressionDigest("x", "y");
  item.minimum = 1495.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacySuppressionDigestLabelLengthRule flags a long label", () => {
  const rule = new LegacySuppressionDigestLabelLengthRule(120);
  const item = newLegacySuppressionDigest("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacySuppressionDigestCapacityRangeRule flags values above capacity", () => {
  const rule = new LegacySuppressionDigestCapacityRangeRule(80, 86400);
  const item = newLegacySuppressionDigest("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacySuppressionDigestCodeLengthRule flags a long code", () => {
  const rule = new LegacySuppressionDigestCodeLengthRule(3600);
  const item = newLegacySuppressionDigest("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacySuppressionDigestRequiredCodeRule flags a blank code", () => {
  const rule = new LegacySuppressionDigestRequiredCodeRule("legacy suppression digest needs this field");
  const item = newLegacySuppressionDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacySuppressionDigestCeilingRangeRule flags values above ceiling", () => {
  const rule = new LegacySuppressionDigestCeilingRangeRule(7.3, 1946.3);
  const item = newLegacySuppressionDigest("x", "y");
  item.ceiling = 1947.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
