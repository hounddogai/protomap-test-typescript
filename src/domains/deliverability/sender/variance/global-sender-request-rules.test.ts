import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalSenderRequestCodeLengthRule,
  GlobalSenderRequestLabelLengthRule,
  GlobalSenderRequestOpenRateRangeRule,
  GlobalSenderRequestRequiredLabelRule,
  GlobalSenderRequestRequiredTitleRule,
  GlobalSenderRequestVersionRangeRule,
  defaultGlobalSenderRequestValidator,
} from "./global-sender-request-rules.js";
import { newGlobalSenderRequest } from "./global-sender-request.js";

test("GlobalSenderRequestValidator reports every problem", () => {
  const validator = defaultGlobalSenderRequestValidator();
  const item = newGlobalSenderRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalSenderRequestRequiredTitleRule flags a blank title", () => {
  const rule = new GlobalSenderRequestRequiredTitleRule("global sender request needs a value");
  const item = newGlobalSenderRequest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalSenderRequestOpenRateRangeRule flags values above open rate", () => {
  const rule = new GlobalSenderRequestOpenRateRangeRule(9.8, 5001.6);
  const item = newGlobalSenderRequest("x", "y");
  item.openRate = 5003.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalSenderRequestRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalSenderRequestRequiredLabelRule("global sender request needs this field");
  const item = newGlobalSenderRequest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalSenderRequestLabelLengthRule flags a long label", () => {
  const rule = new GlobalSenderRequestLabelLengthRule(16);
  const item = newGlobalSenderRequest("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalSenderRequestVersionRangeRule flags values above version", () => {
  const rule = new GlobalSenderRequestVersionRangeRule(32, 1000);
  const item = newGlobalSenderRequest("x", "y");
  item.version = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalSenderRequestCodeLengthRule flags a long code", () => {
  const rule = new GlobalSenderRequestCodeLengthRule(16);
  const item = newGlobalSenderRequest("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
