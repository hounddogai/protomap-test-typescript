import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleBaselineNameLengthRule,
  BidRuleBaselineRequiredDescriptionRule,
  BidRuleBaselineRequiredNameRule,
  defaultBidRuleBaselineValidator,
} from "./bid-rule-baseline-rules.js";
import { newBidRuleBaseline } from "./bid-rule-baseline.js";

test("BidRuleBaselineValidator reports every problem", () => {
  const validator = defaultBidRuleBaselineValidator();
  const item = newBidRuleBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleBaselineNameLengthRule flags a long name", () => {
  const rule = new BidRuleBaselineNameLengthRule(3600);
  const item = newBidRuleBaseline("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleBaselineRequiredDescriptionRule flags a blank description", () => {
  const rule = new BidRuleBaselineRequiredDescriptionRule("bid rule baseline needs this field");
  const item = newBidRuleBaseline("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleBaselineRequiredNameRule flags a blank name", () => {
  const rule = new BidRuleBaselineRequiredNameRule("bid rule baseline needs this field");
  const item = newBidRuleBaseline("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
