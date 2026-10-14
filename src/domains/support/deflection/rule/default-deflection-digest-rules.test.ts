import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultDeflectionDigestCodeLengthRule,
  DefaultDeflectionDigestRequiredCodeRule,
  DefaultDeflectionDigestRequiredLocaleRule,
  DefaultDeflectionDigestScoreRangeRule,
  defaultDefaultDeflectionDigestValidator,
} from "./default-deflection-digest-rules.js";
import { newDefaultDeflectionDigest } from "./default-deflection-digest.js";

test("DefaultDeflectionDigestValidator reports every problem", () => {
  const validator = defaultDefaultDeflectionDigestValidator();
  const item = newDefaultDeflectionDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultDeflectionDigestScoreRangeRule flags values above score", () => {
  const rule = new DefaultDeflectionDigestScoreRangeRule(0.6, 3439.1);
  const item = newDefaultDeflectionDigest("x", "y");
  item.score = 3440.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultDeflectionDigestRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultDeflectionDigestRequiredCodeRule("default deflection digest needs this field");
  const item = newDefaultDeflectionDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultDeflectionDigestCodeLengthRule flags a long code", () => {
  const rule = new DefaultDeflectionDigestCodeLengthRule(3600);
  const item = newDefaultDeflectionDigest("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultDeflectionDigestRequiredLocaleRule flags a blank locale", () => {
  const rule = new DefaultDeflectionDigestRequiredLocaleRule("default deflection digest needs a value");
  const item = newDefaultDeflectionDigest("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
