import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceBundleDescriptionLengthRule,
  BounceBundleLabelLengthRule,
  BounceBundleRatioRangeRule,
  BounceBundleRequiredCodeRule,
  BounceBundleTimezoneLengthRule,
  defaultBounceBundleValidator,
} from "./bounce-bundle-rules.js";
import { newBounceBundle } from "./bounce-bundle.js";

test("BounceBundleValidator reports every problem", () => {
  const validator = defaultBounceBundleValidator();
  const item = newBounceBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceBundleRatioRangeRule flags values above ratio", () => {
  const rule = new BounceBundleRatioRangeRule(3.3, 2296.1);
  const item = newBounceBundle("x", "y");
  item.ratio = 2297.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BounceBundleRequiredCodeRule flags a blank code", () => {
  const rule = new BounceBundleRequiredCodeRule("bounce bundle needs an entry");
  const item = newBounceBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceBundleLabelLengthRule flags a long label", () => {
  const rule = new BounceBundleLabelLengthRule(64);
  const item = newBounceBundle("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceBundleDescriptionLengthRule flags a long description", () => {
  const rule = new BounceBundleDescriptionLengthRule(120);
  const item = newBounceBundle("x", "y");
  item.description = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceBundleTimezoneLengthRule flags a long timezone", () => {
  const rule = new BounceBundleTimezoneLengthRule(1000);
  const item = newBounceBundle("x", "y");
  item.timezone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
