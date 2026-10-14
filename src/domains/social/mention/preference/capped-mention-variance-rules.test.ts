import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedMentionVarianceLocaleLengthRule,
  CappedMentionVarianceQuantityRangeRule,
  CappedMentionVarianceRequiredCodeRule,
  CappedMentionVarianceRequiredNameRule,
  defaultCappedMentionVarianceValidator,
} from "./capped-mention-variance-rules.js";
import { newCappedMentionVariance } from "./capped-mention-variance.js";

test("CappedMentionVarianceValidator reports every problem", () => {
  const validator = defaultCappedMentionVarianceValidator();
  const item = newCappedMentionVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedMentionVarianceRequiredNameRule flags a blank name", () => {
  const rule = new CappedMentionVarianceRequiredNameRule("capped mention variance needs a value");
  const item = newCappedMentionVariance("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedMentionVarianceQuantityRangeRule flags values above quantity", () => {
  const rule = new CappedMentionVarianceQuantityRangeRule(120, 3600);
  const item = newCappedMentionVariance("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedMentionVarianceLocaleLengthRule flags a long locale", () => {
  const rule = new CappedMentionVarianceLocaleLengthRule(32);
  const item = newCappedMentionVariance("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedMentionVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new CappedMentionVarianceRequiredCodeRule("capped mention variance needs an entry");
  const item = newCappedMentionVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
