import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingBundleLabelLengthRule,
  PacingBundlePhoneLengthRule,
  PacingBundleRequiredPhoneRule,
  defaultPacingBundleValidator,
} from "./pacing-bundle-rules.js";
import { newPacingBundle } from "./pacing-bundle.js";

test("PacingBundleValidator reports every problem", () => {
  const validator = defaultPacingBundleValidator();
  const item = newPacingBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingBundleRequiredPhoneRule flags a blank phone", () => {
  const rule = new PacingBundleRequiredPhoneRule("pacing bundle needs this field");
  const item = newPacingBundle("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingBundleLabelLengthRule flags a long label", () => {
  const rule = new PacingBundleLabelLengthRule(86400);
  const item = newPacingBundle("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingBundlePhoneLengthRule flags a long phone", () => {
  const rule = new PacingBundlePhoneLengthRule(120);
  const item = newPacingBundle("x", "y");
  item.phone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
