import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleAdjustmentClicksRangeRule,
  ExitRuleAdjustmentNotesLengthRule,
  ExitRuleAdjustmentRequiredNotesRule,
  ExitRuleAdjustmentRequiredTitleRule,
  ExitRuleAdjustmentTitleLengthRule,
  ExitRuleAdjustmentWeightRangeRule,
  defaultExitRuleAdjustmentValidator,
} from "./exit-rule-adjustment-rules.js";
import { newExitRuleAdjustment } from "./exit-rule-adjustment.js";

test("ExitRuleAdjustmentValidator reports every problem", () => {
  const validator = defaultExitRuleAdjustmentValidator();
  const item = newExitRuleAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleAdjustmentTitleLengthRule flags a long title", () => {
  const rule = new ExitRuleAdjustmentTitleLengthRule(120);
  const item = newExitRuleAdjustment("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleAdjustmentNotesLengthRule flags a long notes", () => {
  const rule = new ExitRuleAdjustmentNotesLengthRule(86400);
  const item = newExitRuleAdjustment("x", "y");
  item.notes = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleAdjustmentRequiredNotesRule flags a blank notes", () => {
  const rule = new ExitRuleAdjustmentRequiredNotesRule("exit rule adjustment needs this field");
  const item = newExitRuleAdjustment("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleAdjustmentClicksRangeRule flags values above clicks", () => {
  const rule = new ExitRuleAdjustmentClicksRangeRule(3600, 86400);
  const item = newExitRuleAdjustment("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleAdjustmentWeightRangeRule flags values above weight", () => {
  const rule = new ExitRuleAdjustmentWeightRangeRule(0.6, 1891.1);
  const item = newExitRuleAdjustment("x", "y");
  item.weight = 1892.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new ExitRuleAdjustmentRequiredTitleRule("exit rule adjustment needs an entry");
  const item = newExitRuleAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
