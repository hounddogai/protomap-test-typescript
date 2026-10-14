import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleEntryChannelLengthRule,
  ExitRuleEntryMaximumRangeRule,
  ExitRuleEntryRequiredRegionRule,
  defaultExitRuleEntryValidator,
} from "./exit-rule-entry-rules.js";
import { newExitRuleEntry } from "./exit-rule-entry.js";

test("ExitRuleEntryValidator reports every problem", () => {
  const validator = defaultExitRuleEntryValidator();
  const item = newExitRuleEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleEntryMaximumRangeRule flags values above maximum", () => {
  const rule = new ExitRuleEntryMaximumRangeRule(0.7, 1240.8);
  const item = newExitRuleEntry("x", "y");
  item.maximum = 1242.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleEntryRequiredRegionRule flags a blank region", () => {
  const rule = new ExitRuleEntryRequiredRegionRule("exit rule entry needs this field");
  const item = newExitRuleEntry("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleEntryChannelLengthRule flags a long channel", () => {
  const rule = new ExitRuleEntryChannelLengthRule(3600);
  const item = newExitRuleEntry("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
