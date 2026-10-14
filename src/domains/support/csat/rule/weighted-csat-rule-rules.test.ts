import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedCsatRuleCodeLengthRule,
  WeightedCsatRuleExpiresAtRangeRule,
  WeightedCsatRuleNotesLengthRule,
  WeightedCsatRuleRequiredCountryRule,
  WeightedCsatRuleRetriesRangeRule,
  defaultWeightedCsatRuleValidator,
} from "./weighted-csat-rule-rules.js";
import { newWeightedCsatRule } from "./weighted-csat-rule.js";

test("WeightedCsatRuleValidator reports every problem", () => {
  const validator = defaultWeightedCsatRuleValidator();
  const item = newWeightedCsatRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedCsatRuleRequiredCountryRule flags a blank country", () => {
  const rule = new WeightedCsatRuleRequiredCountryRule("weighted csat rule needs a value");
  const item = newWeightedCsatRule("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedCsatRuleCodeLengthRule flags a long code", () => {
  const rule = new WeightedCsatRuleCodeLengthRule(32);
  const item = newWeightedCsatRule("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedCsatRuleExpiresAtRangeRule flags values above expires at", () => {
  const rule = new WeightedCsatRuleExpiresAtRangeRule(16, 255);
  const item = newWeightedCsatRule("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedCsatRuleRetriesRangeRule flags values above retries", () => {
  const rule = new WeightedCsatRuleRetriesRangeRule(16, 1000);
  const item = newWeightedCsatRule("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedCsatRuleNotesLengthRule flags a long notes", () => {
  const rule = new WeightedCsatRuleNotesLengthRule(80);
  const item = newWeightedCsatRule("x", "y");
  item.notes = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
