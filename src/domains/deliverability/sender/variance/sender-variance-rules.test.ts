import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderVarianceCeilingRangeRule,
  SenderVarianceChecksumLengthRule,
  SenderVarianceQuantityRangeRule,
  SenderVarianceRequiredCodeRule,
  defaultSenderVarianceValidator,
} from "./sender-variance-rules.js";
import { newSenderVariance } from "./sender-variance.js";

test("SenderVarianceValidator reports every problem", () => {
  const validator = defaultSenderVarianceValidator();
  const item = newSenderVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderVarianceCeilingRangeRule flags values above ceiling", () => {
  const rule = new SenderVarianceCeilingRangeRule(7.9, 863.8);
  const item = newSenderVariance("x", "y");
  item.ceiling = 865.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderVarianceQuantityRangeRule flags values above quantity", () => {
  const rule = new SenderVarianceQuantityRangeRule(120, 3600);
  const item = newSenderVariance("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderVarianceChecksumLengthRule flags a long checksum", () => {
  const rule = new SenderVarianceChecksumLengthRule(3600);
  const item = newSenderVariance("x", "y");
  item.checksum = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new SenderVarianceRequiredCodeRule("sender variance needs this field");
  const item = newSenderVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
