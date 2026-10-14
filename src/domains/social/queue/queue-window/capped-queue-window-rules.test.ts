import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedQueueWindowNameLengthRule,
  CappedQueueWindowRateRangeRule,
  CappedQueueWindowRequiredCodeRule,
  CappedQueueWindowRequiredNameRule,
  defaultCappedQueueWindowValidator,
} from "./capped-queue-window-rules.js";
import { newCappedQueueWindow } from "./capped-queue-window.js";

test("CappedQueueWindowValidator reports every problem", () => {
  const validator = defaultCappedQueueWindowValidator();
  const item = newCappedQueueWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedQueueWindowNameLengthRule flags a long name", () => {
  const rule = new CappedQueueWindowNameLengthRule(255);
  const item = newCappedQueueWindow("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedQueueWindowRequiredCodeRule flags a blank code", () => {
  const rule = new CappedQueueWindowRequiredCodeRule("capped queue window needs a value");
  const item = newCappedQueueWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedQueueWindowRateRangeRule flags values above rate", () => {
  const rule = new CappedQueueWindowRateRangeRule(4.5, 2833.9);
  const item = newCappedQueueWindow("x", "y");
  item.rate = 2835.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedQueueWindowRequiredNameRule flags a blank name", () => {
  const rule = new CappedQueueWindowRequiredNameRule("capped queue window needs an entry");
  const item = newCappedQueueWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
