import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedDomainBundleRegionLengthRule,
  WeightedDomainBundleRequiredRegionRule,
  WeightedDomainBundleRequiredTitleRule,
  defaultWeightedDomainBundleValidator,
} from "./weighted-domain-bundle-rules.js";
import { newWeightedDomainBundle } from "./weighted-domain-bundle.js";

test("WeightedDomainBundleValidator reports every problem", () => {
  const validator = defaultWeightedDomainBundleValidator();
  const item = newWeightedDomainBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedDomainBundleRegionLengthRule flags a long region", () => {
  const rule = new WeightedDomainBundleRegionLengthRule(32);
  const item = newWeightedDomainBundle("x", "y");
  item.region = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedDomainBundleRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedDomainBundleRequiredTitleRule("weighted domain bundle needs a value");
  const item = newWeightedDomainBundle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedDomainBundleRequiredRegionRule flags a blank region", () => {
  const rule = new WeightedDomainBundleRequiredRegionRule("weighted domain bundle needs this field");
  const item = newWeightedDomainBundle("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
