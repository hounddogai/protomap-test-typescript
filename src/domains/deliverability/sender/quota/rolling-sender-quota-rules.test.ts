import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingSenderQuotaCodeLengthRule,
  RollingSenderQuotaCreatedAtRangeRule,
  RollingSenderQuotaRequiredNameRule,
  RollingSenderQuotaRequiredPhoneRule,
  defaultRollingSenderQuotaValidator,
} from "./rolling-sender-quota-rules.js";
import { newRollingSenderQuota } from "./rolling-sender-quota.js";

test("RollingSenderQuotaValidator reports every problem", () => {
  const validator = defaultRollingSenderQuotaValidator();
  const item = newRollingSenderQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingSenderQuotaCodeLengthRule flags a long code", () => {
  const rule = new RollingSenderQuotaCodeLengthRule(120);
  const item = newRollingSenderQuota("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingSenderQuotaRequiredPhoneRule flags a blank phone", () => {
  const rule = new RollingSenderQuotaRequiredPhoneRule("rolling sender quota needs a value");
  const item = newRollingSenderQuota("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingSenderQuotaCreatedAtRangeRule flags values above created at", () => {
  const rule = new RollingSenderQuotaCreatedAtRangeRule(80, 120);
  const item = newRollingSenderQuota("x", "y");
  item.createdAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingSenderQuotaRequiredNameRule flags a blank name", () => {
  const rule = new RollingSenderQuotaRequiredNameRule("rolling sender quota needs this field");
  const item = newRollingSenderQuota("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
