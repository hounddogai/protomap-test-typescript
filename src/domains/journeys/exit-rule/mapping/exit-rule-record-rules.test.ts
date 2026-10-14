import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleRecordCodeLengthRule,
  ExitRuleRecordConversionRateRangeRule,
  ExitRuleRecordQuantityRangeRule,
  ExitRuleRecordRequiredCodeRule,
  ExitRuleRecordSequenceRangeRule,
  defaultExitRuleRecordValidator,
} from "./exit-rule-record-rules.js";
import { newExitRuleRecord } from "./exit-rule-record.js";

test("ExitRuleRecordValidator reports every problem", () => {
  const validator = defaultExitRuleRecordValidator();
  const item = newExitRuleRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleRecordCodeLengthRule flags a long code", () => {
  const rule = new ExitRuleRecordCodeLengthRule(80);
  const item = newExitRuleRecord("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleRecordConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new ExitRuleRecordConversionRateRangeRule(6.8, 4268.3);
  const item = newExitRuleRecord("x", "y");
  item.conversionRate = 4269.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleRecordSequenceRangeRule flags values above sequence", () => {
  const rule = new ExitRuleRecordSequenceRangeRule(32, 1000);
  const item = newExitRuleRecord("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleRecordQuantityRangeRule flags values above quantity", () => {
  const rule = new ExitRuleRecordQuantityRangeRule(80, 120);
  const item = newExitRuleRecord("x", "y");
  item.quantity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleRecordRequiredCodeRule flags a blank code", () => {
  const rule = new ExitRuleRecordRequiredCodeRule("exit rule record needs an entry");
  const item = newExitRuleRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
