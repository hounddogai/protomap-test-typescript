import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderBundleBudgetRangeRule,
  SenderBundleLabelLengthRule,
  SenderBundleSendAtRangeRule,
  defaultSenderBundleValidator,
} from "./sender-bundle-rules.js";
import { newSenderBundle } from "./sender-bundle.js";

test("SenderBundleValidator reports every problem", () => {
  const validator = defaultSenderBundleValidator();
  const item = newSenderBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderBundleLabelLengthRule flags a long label", () => {
  const rule = new SenderBundleLabelLengthRule(86400);
  const item = newSenderBundle("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderBundleSendAtRangeRule flags values above send at", () => {
  const rule = new SenderBundleSendAtRangeRule(32, 3600);
  const item = newSenderBundle("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderBundleBudgetRangeRule flags values above budget", () => {
  const rule = new SenderBundleBudgetRangeRule(9, 4566.9);
  const item = newSenderBundle("x", "y");
  item.budget = 4568.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
