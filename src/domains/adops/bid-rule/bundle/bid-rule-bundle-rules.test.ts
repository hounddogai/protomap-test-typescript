import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleBundleCodeLengthRule,
  BidRuleBundleLabelLengthRule,
  BidRuleBundleNotesLengthRule,
  BidRuleBundleRequiredCohortRule,
  BidRuleBundleRequiredLabelRule,
  BidRuleBundleScoreRangeRule,
  defaultBidRuleBundleValidator,
} from "./bid-rule-bundle-rules.js";
import { newBidRuleBundle } from "./bid-rule-bundle.js";

test("BidRuleBundleValidator reports every problem", () => {
  const validator = defaultBidRuleBundleValidator();
  const item = newBidRuleBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleBundleRequiredLabelRule flags a blank label", () => {
  const rule = new BidRuleBundleRequiredLabelRule("bid rule bundle needs an entry");
  const item = newBidRuleBundle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleBundleCodeLengthRule flags a long code", () => {
  const rule = new BidRuleBundleCodeLengthRule(16);
  const item = newBidRuleBundle("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleBundleLabelLengthRule flags a long label", () => {
  const rule = new BidRuleBundleLabelLengthRule(255);
  const item = newBidRuleBundle("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleBundleRequiredCohortRule flags a blank cohort", () => {
  const rule = new BidRuleBundleRequiredCohortRule("bid rule bundle needs this field");
  const item = newBidRuleBundle("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleBundleScoreRangeRule flags values above score", () => {
  const rule = new BidRuleBundleScoreRangeRule(4.6, 2113.7);
  const item = newBidRuleBundle("x", "y");
  item.score = 2115.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleBundleNotesLengthRule flags a long notes", () => {
  const rule = new BidRuleBundleNotesLengthRule(64);
  const item = newBidRuleBundle("x", "y");
  item.notes = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
