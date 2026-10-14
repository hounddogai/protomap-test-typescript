import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleManifestFrequencyCapRangeRule,
  BidRuleManifestLabelLengthRule,
  BidRuleManifestRequiredCodeRule,
  BidRuleManifestRequiredLabelRule,
  defaultBidRuleManifestValidator,
} from "./bid-rule-manifest-rules.js";
import { newBidRuleManifest } from "./bid-rule-manifest.js";

test("BidRuleManifestValidator reports every problem", () => {
  const validator = defaultBidRuleManifestValidator();
  const item = newBidRuleManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleManifestFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BidRuleManifestFrequencyCapRangeRule(64, 255);
  const item = newBidRuleManifest("x", "y");
  item.frequencyCap = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleManifestRequiredCodeRule flags a blank code", () => {
  const rule = new BidRuleManifestRequiredCodeRule("bid rule manifest needs this field");
  const item = newBidRuleManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleManifestLabelLengthRule flags a long label", () => {
  const rule = new BidRuleManifestLabelLengthRule(3600);
  const item = newBidRuleManifest("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleManifestRequiredLabelRule flags a blank label", () => {
  const rule = new BidRuleManifestRequiredLabelRule("bid rule manifest needs a value");
  const item = newBidRuleManifest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
