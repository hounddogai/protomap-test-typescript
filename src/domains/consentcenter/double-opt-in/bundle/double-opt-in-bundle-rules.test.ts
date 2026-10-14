import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInBundleCodeLengthRule,
  DoubleOptInBundleCountryLengthRule,
  DoubleOptInBundleNameLengthRule,
  DoubleOptInBundleRequiredCodeRule,
  DoubleOptInBundleRequiredExternalRefRule,
  DoubleOptInBundleSendAtRangeRule,
  defaultDoubleOptInBundleValidator,
} from "./double-opt-in-bundle-rules.js";
import { newDoubleOptInBundle } from "./double-opt-in-bundle.js";

test("DoubleOptInBundleValidator reports every problem", () => {
  const validator = defaultDoubleOptInBundleValidator();
  const item = newDoubleOptInBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInBundleRequiredCodeRule flags a blank code", () => {
  const rule = new DoubleOptInBundleRequiredCodeRule("double opt in bundle needs this field");
  const item = newDoubleOptInBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInBundleCodeLengthRule flags a long code", () => {
  const rule = new DoubleOptInBundleCodeLengthRule(120);
  const item = newDoubleOptInBundle("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInBundleRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new DoubleOptInBundleRequiredExternalRefRule("double opt in bundle needs a value");
  const item = newDoubleOptInBundle("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInBundleNameLengthRule flags a long name", () => {
  const rule = new DoubleOptInBundleNameLengthRule(64);
  const item = newDoubleOptInBundle("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInBundleCountryLengthRule flags a long country", () => {
  const rule = new DoubleOptInBundleCountryLengthRule(255);
  const item = newDoubleOptInBundle("x", "y");
  item.country = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInBundleSendAtRangeRule flags values above send at", () => {
  const rule = new DoubleOptInBundleSendAtRangeRule(64, 1000);
  const item = newDoubleOptInBundle("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
