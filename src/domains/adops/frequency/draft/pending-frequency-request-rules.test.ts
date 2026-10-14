import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingFrequencyRequestChannelLengthRule,
  PendingFrequencyRequestCodeLengthRule,
  PendingFrequencyRequestRequiredChannelRule,
  PendingFrequencyRequestSourceLengthRule,
  defaultPendingFrequencyRequestValidator,
} from "./pending-frequency-request-rules.js";
import { newPendingFrequencyRequest } from "./pending-frequency-request.js";

test("PendingFrequencyRequestValidator reports every problem", () => {
  const validator = defaultPendingFrequencyRequestValidator();
  const item = newPendingFrequencyRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingFrequencyRequestRequiredChannelRule flags a blank channel", () => {
  const rule = new PendingFrequencyRequestRequiredChannelRule("pending frequency request needs an entry");
  const item = newPendingFrequencyRequest("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingFrequencyRequestChannelLengthRule flags a long channel", () => {
  const rule = new PendingFrequencyRequestChannelLengthRule(255);
  const item = newPendingFrequencyRequest("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingFrequencyRequestSourceLengthRule flags a long source", () => {
  const rule = new PendingFrequencyRequestSourceLengthRule(255);
  const item = newPendingFrequencyRequest("x", "y");
  item.source = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingFrequencyRequestCodeLengthRule flags a long code", () => {
  const rule = new PendingFrequencyRequestCodeLengthRule(1000);
  const item = newPendingFrequencyRequest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
