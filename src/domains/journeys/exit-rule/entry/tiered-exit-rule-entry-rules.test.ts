import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredExitRuleEntryCodeLengthRule,
  TieredExitRuleEntryLimitRangeRule,
  TieredExitRuleEntryRateRangeRule,
  TieredExitRuleEntryRequiredTitleRule,
  TieredExitRuleEntryUnitLengthRule,
  defaultTieredExitRuleEntryValidator,
} from "./tiered-exit-rule-entry-rules.js";
import { newTieredExitRuleEntry } from "./tiered-exit-rule-entry.js";

test("TieredExitRuleEntryValidator reports every problem", () => {
  const validator = defaultTieredExitRuleEntryValidator();
  const item = newTieredExitRuleEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredExitRuleEntryUnitLengthRule flags a long unit", () => {
  const rule = new TieredExitRuleEntryUnitLengthRule(80);
  const item = newTieredExitRuleEntry("x", "y");
  item.unit = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredExitRuleEntryCodeLengthRule flags a long code", () => {
  const rule = new TieredExitRuleEntryCodeLengthRule(16);
  const item = newTieredExitRuleEntry("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredExitRuleEntryRateRangeRule flags values above rate", () => {
  const rule = new TieredExitRuleEntryRateRangeRule(4.7, 3184.4);
  const item = newTieredExitRuleEntry("x", "y");
  item.rate = 3185.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredExitRuleEntryLimitRangeRule flags values above limit", () => {
  const rule = new TieredExitRuleEntryLimitRangeRule(16, 86400);
  const item = newTieredExitRuleEntry("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredExitRuleEntryRequiredTitleRule flags a blank title", () => {
  const rule = new TieredExitRuleEntryRequiredTitleRule("tiered exit rule entry needs a value");
  const item = newTieredExitRuleEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
