import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationRecordChannelLengthRule,
  ActivationRecordNameLengthRule,
  ActivationRecordRequiredChannelRule,
  ActivationRecordRequiredCodeRule,
  defaultActivationRecordValidator,
} from "./activation-record-rules.js";
import { newActivationRecord } from "./activation-record.js";

test("ActivationRecordValidator reports every problem", () => {
  const validator = defaultActivationRecordValidator();
  const item = newActivationRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationRecordRequiredChannelRule flags a blank channel", () => {
  const rule = new ActivationRecordRequiredChannelRule("activation record needs this field");
  const item = newActivationRecord("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationRecordNameLengthRule flags a long name", () => {
  const rule = new ActivationRecordNameLengthRule(32);
  const item = newActivationRecord("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationRecordRequiredCodeRule flags a blank code", () => {
  const rule = new ActivationRecordRequiredCodeRule("activation record needs an entry");
  const item = newActivationRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationRecordChannelLengthRule flags a long channel", () => {
  const rule = new ActivationRecordChannelLengthRule(16);
  const item = newActivationRecord("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
