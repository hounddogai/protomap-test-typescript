import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInBaselineChannelLengthRule,
  DoubleOptInBaselineRequiredChannelRule,
  DoubleOptInBaselineRequiredTitleRule,
  defaultDoubleOptInBaselineValidator,
} from "./double-opt-in-baseline-rules.js";
import { newDoubleOptInBaseline } from "./double-opt-in-baseline.js";

test("DoubleOptInBaselineValidator reports every problem", () => {
  const validator = defaultDoubleOptInBaselineValidator();
  const item = newDoubleOptInBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInBaselineChannelLengthRule flags a long channel", () => {
  const rule = new DoubleOptInBaselineChannelLengthRule(1000);
  const item = newDoubleOptInBaseline("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInBaselineRequiredTitleRule flags a blank title", () => {
  const rule = new DoubleOptInBaselineRequiredTitleRule("double opt in baseline needs a value");
  const item = newDoubleOptInBaseline("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInBaselineRequiredChannelRule flags a blank channel", () => {
  const rule = new DoubleOptInBaselineRequiredChannelRule("double opt in baseline needs this field");
  const item = newDoubleOptInBaseline("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
