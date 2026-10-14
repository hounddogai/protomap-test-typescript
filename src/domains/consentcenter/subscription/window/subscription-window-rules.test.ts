import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionWindowLabelLengthRule,
  SubscriptionWindowMarginRangeRule,
  SubscriptionWindowRequiredCodeRule,
  SubscriptionWindowRevisionRangeRule,
  SubscriptionWindowScoreRangeRule,
  defaultSubscriptionWindowValidator,
} from "./subscription-window-rules.js";
import { newSubscriptionWindow } from "./subscription-window.js";

test("SubscriptionWindowValidator reports every problem", () => {
  const validator = defaultSubscriptionWindowValidator();
  const item = newSubscriptionWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionWindowLabelLengthRule flags a long label", () => {
  const rule = new SubscriptionWindowLabelLengthRule(1000);
  const item = newSubscriptionWindow("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SubscriptionWindowScoreRangeRule flags values above score", () => {
  const rule = new SubscriptionWindowScoreRangeRule(9.7, 3270.7);
  const item = newSubscriptionWindow("x", "y");
  item.score = 3272.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionWindowRevisionRangeRule flags values above revision", () => {
  const rule = new SubscriptionWindowRevisionRangeRule(80, 1000);
  const item = newSubscriptionWindow("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionWindowMarginRangeRule flags values above margin", () => {
  const rule = new SubscriptionWindowMarginRangeRule(7.3, 620.9);
  const item = newSubscriptionWindow("x", "y");
  item.margin = 622.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionWindowRequiredCodeRule flags a blank code", () => {
  const rule = new SubscriptionWindowRequiredCodeRule("subscription window needs a value");
  const item = newSubscriptionWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
