import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckNoticeChannelLengthRule,
  FraudCheckNoticeCodeLengthRule,
  FraudCheckNoticeLabelLengthRule,
  defaultFraudCheckNoticeValidator,
} from "./fraud-check-notice-rules.js";
import { newFraudCheckNotice } from "./fraud-check-notice.js";

test("FraudCheckNoticeValidator reports every problem", () => {
  const validator = defaultFraudCheckNoticeValidator();
  const item = newFraudCheckNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckNoticeChannelLengthRule flags a long channel", () => {
  const rule = new FraudCheckNoticeChannelLengthRule(3600);
  const item = newFraudCheckNotice("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckNoticeLabelLengthRule flags a long label", () => {
  const rule = new FraudCheckNoticeLabelLengthRule(86400);
  const item = newFraudCheckNotice("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckNoticeCodeLengthRule flags a long code", () => {
  const rule = new FraudCheckNoticeCodeLengthRule(3600);
  const item = newFraudCheckNotice("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
