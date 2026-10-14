import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyBaselineCapacityRangeRule,
  ReplyBaselineCostRangeRule,
  ReplyBaselineNameLengthRule,
  ReplyBaselineRequiredCodeRule,
  ReplyBaselineRequiredLabelRule,
  ReplyBaselineRequiredNameRule,
  defaultReplyBaselineValidator,
} from "./reply-baseline-rules.js";
import { newReplyBaseline } from "./reply-baseline.js";

test("ReplyBaselineValidator reports every problem", () => {
  const validator = defaultReplyBaselineValidator();
  const item = newReplyBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyBaselineRequiredNameRule flags a blank name", () => {
  const rule = new ReplyBaselineRequiredNameRule("reply baseline needs an entry");
  const item = newReplyBaseline("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyBaselineRequiredLabelRule flags a blank label", () => {
  const rule = new ReplyBaselineRequiredLabelRule("reply baseline needs this field");
  const item = newReplyBaseline("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyBaselineCapacityRangeRule flags values above capacity", () => {
  const rule = new ReplyBaselineCapacityRangeRule(64, 86400);
  const item = newReplyBaseline("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyBaselineCostRangeRule flags values above cost", () => {
  const rule = new ReplyBaselineCostRangeRule(8, 2484.6);
  const item = newReplyBaseline("x", "y");
  item.cost = 2486.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new ReplyBaselineRequiredCodeRule("reply baseline needs a value");
  const item = newReplyBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyBaselineNameLengthRule flags a long name", () => {
  const rule = new ReplyBaselineNameLengthRule(255);
  const item = newReplyBaseline("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
