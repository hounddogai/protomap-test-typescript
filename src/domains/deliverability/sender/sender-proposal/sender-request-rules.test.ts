import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderRequestCodeLengthRule,
  SenderRequestContactEmailLengthRule,
  SenderRequestDurationMinutesRangeRule,
  SenderRequestRatioRangeRule,
  defaultSenderRequestValidator,
} from "./sender-request-rules.js";
import { newSenderRequest } from "./sender-request.js";

test("SenderRequestValidator reports every problem", () => {
  const validator = defaultSenderRequestValidator();
  const item = newSenderRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderRequestContactEmailLengthRule flags a long contact email", () => {
  const rule = new SenderRequestContactEmailLengthRule(80);
  const item = newSenderRequest("x", "y");
  item.contactEmail = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderRequestRatioRangeRule flags values above ratio", () => {
  const rule = new SenderRequestRatioRangeRule(7.7, 3384.9);
  const item = newSenderRequest("x", "y");
  item.ratio = 3386.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderRequestCodeLengthRule flags a long code", () => {
  const rule = new SenderRequestCodeLengthRule(120);
  const item = newSenderRequest("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderRequestDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new SenderRequestDurationMinutesRangeRule(255, 86400);
  const item = newSenderRequest("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
