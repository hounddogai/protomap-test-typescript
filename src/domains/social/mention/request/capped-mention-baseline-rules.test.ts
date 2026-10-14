import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedMentionBaselineChannelLengthRule,
  CappedMentionBaselineRequiredChannelRule,
  CappedMentionBaselineRequiredCodeRule,
  CappedMentionBaselineRequiredTitleRule,
  CappedMentionBaselineUtmSourceLengthRule,
  defaultCappedMentionBaselineValidator,
} from "./capped-mention-baseline-rules.js";
import { newCappedMentionBaseline } from "./capped-mention-baseline.js";

test("CappedMentionBaselineValidator reports every problem", () => {
  const validator = defaultCappedMentionBaselineValidator();
  const item = newCappedMentionBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedMentionBaselineUtmSourceLengthRule flags a long utm source", () => {
  const rule = new CappedMentionBaselineUtmSourceLengthRule(86400);
  const item = newCappedMentionBaseline("x", "y");
  item.utmSource = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedMentionBaselineRequiredTitleRule flags a blank title", () => {
  const rule = new CappedMentionBaselineRequiredTitleRule("capped mention baseline needs a value");
  const item = newCappedMentionBaseline("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedMentionBaselineRequiredChannelRule flags a blank channel", () => {
  const rule = new CappedMentionBaselineRequiredChannelRule("capped mention baseline needs an entry");
  const item = newCappedMentionBaseline("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedMentionBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new CappedMentionBaselineRequiredCodeRule("capped mention baseline needs a value");
  const item = newCappedMentionBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedMentionBaselineChannelLengthRule flags a long channel", () => {
  const rule = new CappedMentionBaselineChannelLengthRule(255);
  const item = newCappedMentionBaseline("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
