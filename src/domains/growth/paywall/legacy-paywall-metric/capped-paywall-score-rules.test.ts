import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedPaywallScoreCodeLengthRule,
  CappedPaywallScoreLabelLengthRule,
  CappedPaywallScoreRequiredCodeRule,
  CappedPaywallScoreRequiredReviewerRule,
  defaultCappedPaywallScoreValidator,
} from "./capped-paywall-score-rules.js";
import { newCappedPaywallScore } from "./capped-paywall-score.js";

test("CappedPaywallScoreValidator reports every problem", () => {
  const validator = defaultCappedPaywallScoreValidator();
  const item = newCappedPaywallScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedPaywallScoreRequiredCodeRule flags a blank code", () => {
  const rule = new CappedPaywallScoreRequiredCodeRule("capped paywall score needs this field");
  const item = newCappedPaywallScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedPaywallScoreCodeLengthRule flags a long code", () => {
  const rule = new CappedPaywallScoreCodeLengthRule(80);
  const item = newCappedPaywallScore("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedPaywallScoreLabelLengthRule flags a long label", () => {
  const rule = new CappedPaywallScoreLabelLengthRule(32);
  const item = newCappedPaywallScore("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedPaywallScoreRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new CappedPaywallScoreRequiredReviewerRule("capped paywall score needs a value");
  const item = newCappedPaywallScore("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
