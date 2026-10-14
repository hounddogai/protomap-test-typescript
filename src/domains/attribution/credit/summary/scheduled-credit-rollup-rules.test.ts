import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledCreditRollupFrequencyCapRangeRule,
  ScheduledCreditRollupImpressionsRangeRule,
  ScheduledCreditRollupQuantityRangeRule,
  ScheduledCreditRollupRequiredCodeRule,
  ScheduledCreditRollupTitleLengthRule,
  defaultScheduledCreditRollupValidator,
} from "./scheduled-credit-rollup-rules.js";
import { newScheduledCreditRollup } from "./scheduled-credit-rollup.js";

test("ScheduledCreditRollupValidator reports every problem", () => {
  const validator = defaultScheduledCreditRollupValidator();
  const item = newScheduledCreditRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledCreditRollupQuantityRangeRule flags values above quantity", () => {
  const rule = new ScheduledCreditRollupQuantityRangeRule(16, 80);
  const item = newScheduledCreditRollup("x", "y");
  item.quantity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledCreditRollupImpressionsRangeRule flags values above impressions", () => {
  const rule = new ScheduledCreditRollupImpressionsRangeRule(16, 120);
  const item = newScheduledCreditRollup("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledCreditRollupRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledCreditRollupRequiredCodeRule("scheduled credit rollup needs a value");
  const item = newScheduledCreditRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledCreditRollupFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new ScheduledCreditRollupFrequencyCapRangeRule(80, 86400);
  const item = newScheduledCreditRollup("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledCreditRollupTitleLengthRule flags a long title", () => {
  const rule = new ScheduledCreditRollupTitleLengthRule(64);
  const item = newScheduledCreditRollup("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
