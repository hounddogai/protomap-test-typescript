import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualChallengeBatchAmountRangeRule,
  ManualChallengeBatchAttemptsRangeRule,
  ManualChallengeBatchCodeLengthRule,
  ManualChallengeBatchRequiredCodeRule,
  ManualChallengeBatchRequiredTitleRule,
  defaultManualChallengeBatchValidator,
} from "./manual-challenge-batch-rules.js";
import { newManualChallengeBatch } from "./manual-challenge-batch.js";

test("ManualChallengeBatchValidator reports every problem", () => {
  const validator = defaultManualChallengeBatchValidator();
  const item = newManualChallengeBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualChallengeBatchCodeLengthRule flags a long code", () => {
  const rule = new ManualChallengeBatchCodeLengthRule(3600);
  const item = newManualChallengeBatch("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualChallengeBatchRequiredTitleRule flags a blank title", () => {
  const rule = new ManualChallengeBatchRequiredTitleRule("manual challenge batch needs a value");
  const item = newManualChallengeBatch("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualChallengeBatchAttemptsRangeRule flags values above attempts", () => {
  const rule = new ManualChallengeBatchAttemptsRangeRule(120, 255);
  const item = newManualChallengeBatch("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualChallengeBatchRequiredCodeRule flags a blank code", () => {
  const rule = new ManualChallengeBatchRequiredCodeRule("manual challenge batch needs an entry");
  const item = newManualChallengeBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualChallengeBatchAmountRangeRule flags values above amount", () => {
  const rule = new ManualChallengeBatchAmountRangeRule(8.9, 4014.6);
  const item = newManualChallengeBatch("x", "y");
  item.amount = 4016.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
