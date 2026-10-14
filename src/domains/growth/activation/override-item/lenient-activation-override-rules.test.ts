import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientActivationOverrideNameLengthRule,
  LenientActivationOverrideRequiredCodeRule,
  LenientActivationOverrideRequiredVariantRule,
  LenientActivationOverrideVariantLengthRule,
  defaultLenientActivationOverrideValidator,
} from "./lenient-activation-override-rules.js";
import { newLenientActivationOverride } from "./lenient-activation-override.js";

test("LenientActivationOverrideValidator reports every problem", () => {
  const validator = defaultLenientActivationOverrideValidator();
  const item = newLenientActivationOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientActivationOverrideVariantLengthRule flags a long variant", () => {
  const rule = new LenientActivationOverrideVariantLengthRule(80);
  const item = newLenientActivationOverride("x", "y");
  item.variant = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientActivationOverrideNameLengthRule flags a long name", () => {
  const rule = new LenientActivationOverrideNameLengthRule(3600);
  const item = newLenientActivationOverride("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientActivationOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new LenientActivationOverrideRequiredCodeRule("lenient activation override needs a value");
  const item = newLenientActivationOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientActivationOverrideRequiredVariantRule flags a blank variant", () => {
  const rule = new LenientActivationOverrideRequiredVariantRule("lenient activation override needs an entry");
  const item = newLenientActivationOverride("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
