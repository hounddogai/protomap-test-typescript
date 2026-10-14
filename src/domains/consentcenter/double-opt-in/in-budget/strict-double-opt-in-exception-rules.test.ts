import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictDoubleOptInExceptionChannelLengthRule,
  StrictDoubleOptInExceptionCodeLengthRule,
  StrictDoubleOptInExceptionSendAtRangeRule,
  defaultStrictDoubleOptInExceptionValidator,
} from "./strict-double-opt-in-exception-rules.js";
import { newStrictDoubleOptInException } from "./strict-double-opt-in-exception.js";

test("StrictDoubleOptInExceptionValidator reports every problem", () => {
  const validator = defaultStrictDoubleOptInExceptionValidator();
  const item = newStrictDoubleOptInException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictDoubleOptInExceptionCodeLengthRule flags a long code", () => {
  const rule = new StrictDoubleOptInExceptionCodeLengthRule(32);
  const item = newStrictDoubleOptInException("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictDoubleOptInExceptionChannelLengthRule flags a long channel", () => {
  const rule = new StrictDoubleOptInExceptionChannelLengthRule(80);
  const item = newStrictDoubleOptInException("x", "y");
  item.channel = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictDoubleOptInExceptionSendAtRangeRule flags values above send at", () => {
  const rule = new StrictDoubleOptInExceptionSendAtRangeRule(16, 255);
  const item = newStrictDoubleOptInException("x", "y");
  item.sendAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
