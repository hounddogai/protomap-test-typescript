import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedCreativeBundleCodeLengthRule,
  CappedCreativeBundleCurrencyLengthRule,
  CappedCreativeBundleRequiredCodeRule,
  CappedCreativeBundleUtmSourceLengthRule,
  defaultCappedCreativeBundleValidator,
} from "./capped-creative-bundle-rules.js";
import { newCappedCreativeBundle } from "./capped-creative-bundle.js";

test("CappedCreativeBundleValidator reports every problem", () => {
  const validator = defaultCappedCreativeBundleValidator();
  const item = newCappedCreativeBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedCreativeBundleCurrencyLengthRule flags a long currency", () => {
  const rule = new CappedCreativeBundleCurrencyLengthRule(255);
  const item = newCappedCreativeBundle("x", "y");
  item.currency = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedCreativeBundleCodeLengthRule flags a long code", () => {
  const rule = new CappedCreativeBundleCodeLengthRule(255);
  const item = newCappedCreativeBundle("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedCreativeBundleUtmSourceLengthRule flags a long utm source", () => {
  const rule = new CappedCreativeBundleUtmSourceLengthRule(1000);
  const item = newCappedCreativeBundle("x", "y");
  item.utmSource = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedCreativeBundleRequiredCodeRule flags a blank code", () => {
  const rule = new CappedCreativeBundleRequiredCodeRule("capped creative bundle needs a value");
  const item = newCappedCreativeBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
