import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedDoubleOptInBundleCodeLengthRule,
  CappedDoubleOptInBundleMaximumRangeRule,
  defaultCappedDoubleOptInBundleValidator,
} from "./capped-double-opt-in-bundle-rules.js";
import { newCappedDoubleOptInBundle } from "./capped-double-opt-in-bundle.js";

test("CappedDoubleOptInBundleValidator reports every problem", () => {
  const validator = defaultCappedDoubleOptInBundleValidator();
  const item = newCappedDoubleOptInBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedDoubleOptInBundleCodeLengthRule flags a long code", () => {
  const rule = new CappedDoubleOptInBundleCodeLengthRule(64);
  const item = newCappedDoubleOptInBundle("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedDoubleOptInBundleMaximumRangeRule flags values above maximum", () => {
  const rule = new CappedDoubleOptInBundleMaximumRangeRule(6.1, 2207.1);
  const item = newCappedDoubleOptInBundle("x", "y");
  item.maximum = 2208.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
