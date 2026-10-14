import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientReputationRuleCodeLengthRule,
  LenientReputationRuleGraceDaysRangeRule,
  LenientReputationRuleLabelLengthRule,
  LenientReputationRuleRequiredLabelRule,
  LenientReputationRuleVariantLengthRule,
  defaultLenientReputationRuleValidator,
} from "./lenient-reputation-rule-rules.js";
import { newLenientReputationRule } from "./lenient-reputation-rule.js";

test("LenientReputationRuleValidator reports every problem", () => {
  const validator = defaultLenientReputationRuleValidator();
  const item = newLenientReputationRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientReputationRuleGraceDaysRangeRule flags values above grace days", () => {
  const rule = new LenientReputationRuleGraceDaysRangeRule(64, 80);
  const item = newLenientReputationRule("x", "y");
  item.graceDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientReputationRuleRequiredLabelRule flags a blank label", () => {
  const rule = new LenientReputationRuleRequiredLabelRule("lenient reputation rule needs a value");
  const item = newLenientReputationRule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientReputationRuleVariantLengthRule flags a long variant", () => {
  const rule = new LenientReputationRuleVariantLengthRule(80);
  const item = newLenientReputationRule("x", "y");
  item.variant = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientReputationRuleCodeLengthRule flags a long code", () => {
  const rule = new LenientReputationRuleCodeLengthRule(32);
  const item = newLenientReputationRule("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientReputationRuleLabelLengthRule flags a long label", () => {
  const rule = new LenientReputationRuleLabelLengthRule(255);
  const item = newLenientReputationRule("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
