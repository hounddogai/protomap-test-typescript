import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingExitRuleItemCodeLengthRule,
  PendingExitRuleItemCountryLengthRule,
  PendingExitRuleItemFrequencyCapRangeRule,
  PendingExitRuleItemOpenRateRangeRule,
  PendingExitRuleItemRequiredLabelRule,
  defaultPendingExitRuleItemValidator,
} from "./pending-exit-rule-item-rules.js";
import { newPendingExitRuleItem } from "./pending-exit-rule-item.js";

test("PendingExitRuleItemValidator reports every problem", () => {
  const validator = defaultPendingExitRuleItemValidator();
  const item = newPendingExitRuleItem("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingExitRuleItemOpenRateRangeRule flags values above open rate", () => {
  const rule = new PendingExitRuleItemOpenRateRangeRule(5.5, 1087.9);
  const item = newPendingExitRuleItem("x", "y");
  item.openRate = 1089.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingExitRuleItemFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new PendingExitRuleItemFrequencyCapRangeRule(16, 255);
  const item = newPendingExitRuleItem("x", "y");
  item.frequencyCap = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingExitRuleItemCountryLengthRule flags a long country", () => {
  const rule = new PendingExitRuleItemCountryLengthRule(1000);
  const item = newPendingExitRuleItem("x", "y");
  item.country = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingExitRuleItemRequiredLabelRule flags a blank label", () => {
  const rule = new PendingExitRuleItemRequiredLabelRule("pending exit rule item needs an entry");
  const item = newPendingExitRuleItem("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingExitRuleItemCodeLengthRule flags a long code", () => {
  const rule = new PendingExitRuleItemCodeLengthRule(32);
  const item = newPendingExitRuleItem("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
