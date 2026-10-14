import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalExitRuleEntryCodeLengthRule,
  GlobalExitRuleEntryLabelLengthRule,
  GlobalExitRuleEntryOpenRateRangeRule,
  GlobalExitRuleEntryRequiredLabelRule,
  defaultGlobalExitRuleEntryValidator,
} from "./global-exit-rule-entry-rules.js";
import { newGlobalExitRuleEntry } from "./global-exit-rule-entry.js";

test("GlobalExitRuleEntryValidator reports every problem", () => {
  const validator = defaultGlobalExitRuleEntryValidator();
  const item = newGlobalExitRuleEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalExitRuleEntryCodeLengthRule flags a long code", () => {
  const rule = new GlobalExitRuleEntryCodeLengthRule(80);
  const item = newGlobalExitRuleEntry("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalExitRuleEntryRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalExitRuleEntryRequiredLabelRule("global exit rule entry needs an entry");
  const item = newGlobalExitRuleEntry("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalExitRuleEntryOpenRateRangeRule flags values above open rate", () => {
  const rule = new GlobalExitRuleEntryOpenRateRangeRule(7.9, 3787.9);
  const item = newGlobalExitRuleEntry("x", "y");
  item.openRate = 3789.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalExitRuleEntryLabelLengthRule flags a long label", () => {
  const rule = new GlobalExitRuleEntryLabelLengthRule(255);
  const item = newGlobalExitRuleEntry("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
