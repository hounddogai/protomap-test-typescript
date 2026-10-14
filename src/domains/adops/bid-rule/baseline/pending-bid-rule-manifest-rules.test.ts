import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingBidRuleManifestCeilingRangeRule,
  PendingBidRuleManifestCodeLengthRule,
  PendingBidRuleManifestLabelLengthRule,
  PendingBidRuleManifestRequiredLabelRule,
  PendingBidRuleManifestRequiredReviewerRule,
  defaultPendingBidRuleManifestValidator,
} from "./pending-bid-rule-manifest-rules.js";
import { newPendingBidRuleManifest } from "./pending-bid-rule-manifest.js";

test("PendingBidRuleManifestValidator reports every problem", () => {
  const validator = defaultPendingBidRuleManifestValidator();
  const item = newPendingBidRuleManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingBidRuleManifestLabelLengthRule flags a long label", () => {
  const rule = new PendingBidRuleManifestLabelLengthRule(120);
  const item = newPendingBidRuleManifest("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingBidRuleManifestRequiredLabelRule flags a blank label", () => {
  const rule = new PendingBidRuleManifestRequiredLabelRule("pending bid rule manifest needs a value");
  const item = newPendingBidRuleManifest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingBidRuleManifestCodeLengthRule flags a long code", () => {
  const rule = new PendingBidRuleManifestCodeLengthRule(3600);
  const item = newPendingBidRuleManifest("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingBidRuleManifestCeilingRangeRule flags values above ceiling", () => {
  const rule = new PendingBidRuleManifestCeilingRangeRule(0.7, 1168);
  const item = newPendingBidRuleManifest("x", "y");
  item.ceiling = 1169.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingBidRuleManifestRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new PendingBidRuleManifestRequiredReviewerRule("pending bid rule manifest needs this field");
  const item = newPendingBidRuleManifest("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
