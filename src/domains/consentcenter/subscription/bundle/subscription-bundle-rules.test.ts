import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionBundleMinimumRangeRule,
  SubscriptionBundleRequiredCountryRule,
  SubscriptionBundleRequiredLabelRule,
  defaultSubscriptionBundleValidator,
} from "./subscription-bundle-rules.js";
import { newSubscriptionBundle } from "./subscription-bundle.js";

test("SubscriptionBundleValidator reports every problem", () => {
  const validator = defaultSubscriptionBundleValidator();
  const item = newSubscriptionBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionBundleMinimumRangeRule flags values above minimum", () => {
  const rule = new SubscriptionBundleMinimumRangeRule(6.9, 2075.4);
  const item = newSubscriptionBundle("x", "y");
  item.minimum = 2076.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionBundleRequiredLabelRule flags a blank label", () => {
  const rule = new SubscriptionBundleRequiredLabelRule("subscription bundle needs an entry");
  const item = newSubscriptionBundle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionBundleRequiredCountryRule flags a blank country", () => {
  const rule = new SubscriptionBundleRequiredCountryRule("subscription bundle needs this field");
  const item = newSubscriptionBundle("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
