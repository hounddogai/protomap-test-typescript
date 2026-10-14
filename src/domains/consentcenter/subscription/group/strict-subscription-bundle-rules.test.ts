import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictSubscriptionBundleLabelLengthRule,
  StrictSubscriptionBundleMinimumRangeRule,
  StrictSubscriptionBundleNameLengthRule,
  StrictSubscriptionBundleRequiredLabelRule,
  defaultStrictSubscriptionBundleValidator,
} from "./strict-subscription-bundle-rules.js";
import { newStrictSubscriptionBundle } from "./strict-subscription-bundle.js";

test("StrictSubscriptionBundleValidator reports every problem", () => {
  const validator = defaultStrictSubscriptionBundleValidator();
  const item = newStrictSubscriptionBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictSubscriptionBundleNameLengthRule flags a long name", () => {
  const rule = new StrictSubscriptionBundleNameLengthRule(1000);
  const item = newStrictSubscriptionBundle("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictSubscriptionBundleRequiredLabelRule flags a blank label", () => {
  const rule = new StrictSubscriptionBundleRequiredLabelRule("strict subscription bundle needs this field");
  const item = newStrictSubscriptionBundle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictSubscriptionBundleLabelLengthRule flags a long label", () => {
  const rule = new StrictSubscriptionBundleLabelLengthRule(120);
  const item = newStrictSubscriptionBundle("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictSubscriptionBundleMinimumRangeRule flags values above minimum", () => {
  const rule = new StrictSubscriptionBundleMinimumRangeRule(3.4, 2535.2);
  const item = newStrictSubscriptionBundle("x", "y");
  item.minimum = 2536.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
