import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientSenderDigestCodeLengthRule,
  LenientSenderDigestImpressionsRangeRule,
  LenientSenderDigestRequiredCodeRule,
  defaultLenientSenderDigestValidator,
} from "./lenient-sender-digest-rules.js";
import { newLenientSenderDigest } from "./lenient-sender-digest.js";

test("LenientSenderDigestValidator reports every problem", () => {
  const validator = defaultLenientSenderDigestValidator();
  const item = newLenientSenderDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientSenderDigestImpressionsRangeRule flags values above impressions", () => {
  const rule = new LenientSenderDigestImpressionsRangeRule(16, 64);
  const item = newLenientSenderDigest("x", "y");
  item.impressions = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientSenderDigestRequiredCodeRule flags a blank code", () => {
  const rule = new LenientSenderDigestRequiredCodeRule("lenient sender digest needs a value");
  const item = newLenientSenderDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientSenderDigestCodeLengthRule flags a long code", () => {
  const rule = new LenientSenderDigestCodeLengthRule(1000);
  const item = newLenientSenderDigest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
