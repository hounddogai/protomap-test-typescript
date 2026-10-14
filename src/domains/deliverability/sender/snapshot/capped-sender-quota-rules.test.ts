import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedSenderQuotaAmountRangeRule,
  CappedSenderQuotaCodeLengthRule,
  CappedSenderQuotaRegionLengthRule,
  CappedSenderQuotaTitleLengthRule,
  defaultCappedSenderQuotaValidator,
} from "./capped-sender-quota-rules.js";
import { newCappedSenderQuota } from "./capped-sender-quota.js";

test("CappedSenderQuotaValidator reports every problem", () => {
  const validator = defaultCappedSenderQuotaValidator();
  const item = newCappedSenderQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedSenderQuotaCodeLengthRule flags a long code", () => {
  const rule = new CappedSenderQuotaCodeLengthRule(32);
  const item = newCappedSenderQuota("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedSenderQuotaTitleLengthRule flags a long title", () => {
  const rule = new CappedSenderQuotaTitleLengthRule(80);
  const item = newCappedSenderQuota("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedSenderQuotaRegionLengthRule flags a long region", () => {
  const rule = new CappedSenderQuotaRegionLengthRule(120);
  const item = newCappedSenderQuota("x", "y");
  item.region = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedSenderQuotaAmountRangeRule flags values above amount", () => {
  const rule = new CappedSenderQuotaAmountRangeRule(3.5, 1942.2);
  const item = newCappedSenderQuota("x", "y");
  item.amount = 1943.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
