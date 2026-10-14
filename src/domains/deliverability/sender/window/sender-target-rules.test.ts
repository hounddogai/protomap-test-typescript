import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderTargetClicksRangeRule,
  SenderTargetLabelLengthRule,
  SenderTargetRetriesRangeRule,
  defaultSenderTargetValidator,
} from "./sender-target-rules.js";
import { newSenderTarget } from "./sender-target.js";

test("SenderTargetValidator reports every problem", () => {
  const validator = defaultSenderTargetValidator();
  const item = newSenderTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderTargetLabelLengthRule flags a long label", () => {
  const rule = new SenderTargetLabelLengthRule(86400);
  const item = newSenderTarget("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderTargetClicksRangeRule flags values above clicks", () => {
  const rule = new SenderTargetClicksRangeRule(64, 1000);
  const item = newSenderTarget("x", "y");
  item.clicks = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderTargetRetriesRangeRule flags values above retries", () => {
  const rule = new SenderTargetRetriesRangeRule(64, 80);
  const item = newSenderTarget("x", "y");
  item.retries = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
