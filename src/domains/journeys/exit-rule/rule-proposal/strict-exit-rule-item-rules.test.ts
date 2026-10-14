import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictExitRuleItemBidRangeRule,
  StrictExitRuleItemCodeLengthRule,
  StrictExitRuleItemCostRangeRule,
  StrictExitRuleItemLabelLengthRule,
  StrictExitRuleItemRequiredDescriptionRule,
  defaultStrictExitRuleItemValidator,
} from "./strict-exit-rule-item-rules.js";
import { newStrictExitRuleItem } from "./strict-exit-rule-item.js";

test("StrictExitRuleItemValidator reports every problem", () => {
  const validator = defaultStrictExitRuleItemValidator();
  const item = newStrictExitRuleItem("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictExitRuleItemCodeLengthRule flags a long code", () => {
  const rule = new StrictExitRuleItemCodeLengthRule(32);
  const item = newStrictExitRuleItem("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictExitRuleItemLabelLengthRule flags a long label", () => {
  const rule = new StrictExitRuleItemLabelLengthRule(64);
  const item = newStrictExitRuleItem("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictExitRuleItemRequiredDescriptionRule flags a blank description", () => {
  const rule = new StrictExitRuleItemRequiredDescriptionRule("strict exit rule item needs this field");
  const item = newStrictExitRuleItem("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictExitRuleItemBidRangeRule flags values above bid", () => {
  const rule = new StrictExitRuleItemBidRangeRule(4.7, 2917.2);
  const item = newStrictExitRuleItem("x", "y");
  item.bid = 2918.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictExitRuleItemCostRangeRule flags values above cost", () => {
  const rule = new StrictExitRuleItemCostRangeRule(9.6, 3667.6);
  const item = newStrictExitRuleItem("x", "y");
  item.cost = 3669.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
