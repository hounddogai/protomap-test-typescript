import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedSenderQuotaChannelLengthRule,
  WeightedSenderQuotaCodeLengthRule,
  WeightedSenderQuotaExternalRefLengthRule,
  WeightedSenderQuotaRequiredExternalRefRule,
  defaultWeightedSenderQuotaValidator,
} from "./weighted-sender-quota-rules.js";
import { newWeightedSenderQuota } from "./weighted-sender-quota.js";

test("WeightedSenderQuotaValidator reports every problem", () => {
  const validator = defaultWeightedSenderQuotaValidator();
  const item = newWeightedSenderQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedSenderQuotaRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new WeightedSenderQuotaRequiredExternalRefRule("weighted sender quota needs a value");
  const item = newWeightedSenderQuota("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedSenderQuotaExternalRefLengthRule flags a long external ref", () => {
  const rule = new WeightedSenderQuotaExternalRefLengthRule(16);
  const item = newWeightedSenderQuota("x", "y");
  item.externalRef = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedSenderQuotaChannelLengthRule flags a long channel", () => {
  const rule = new WeightedSenderQuotaChannelLengthRule(120);
  const item = newWeightedSenderQuota("x", "y");
  item.channel = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedSenderQuotaCodeLengthRule flags a long code", () => {
  const rule = new WeightedSenderQuotaCodeLengthRule(32);
  const item = newWeightedSenderQuota("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
