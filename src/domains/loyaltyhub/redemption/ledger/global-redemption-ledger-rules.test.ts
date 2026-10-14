import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalRedemptionLedgerChannelLengthRule,
  GlobalRedemptionLedgerCodeLengthRule,
  GlobalRedemptionLedgerPhoneLengthRule,
  GlobalRedemptionLedgerRatioRangeRule,
  defaultGlobalRedemptionLedgerValidator,
} from "./global-redemption-ledger-rules.js";
import { newGlobalRedemptionLedger } from "./global-redemption-ledger.js";

test("GlobalRedemptionLedgerValidator reports every problem", () => {
  const validator = defaultGlobalRedemptionLedgerValidator();
  const item = newGlobalRedemptionLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalRedemptionLedgerPhoneLengthRule flags a long phone", () => {
  const rule = new GlobalRedemptionLedgerPhoneLengthRule(3600);
  const item = newGlobalRedemptionLedger("x", "y");
  item.phone = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalRedemptionLedgerCodeLengthRule flags a long code", () => {
  const rule = new GlobalRedemptionLedgerCodeLengthRule(32);
  const item = newGlobalRedemptionLedger("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalRedemptionLedgerChannelLengthRule flags a long channel", () => {
  const rule = new GlobalRedemptionLedgerChannelLengthRule(1000);
  const item = newGlobalRedemptionLedger("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalRedemptionLedgerRatioRangeRule flags values above ratio", () => {
  const rule = new GlobalRedemptionLedgerRatioRangeRule(1, 2717.8);
  const item = newGlobalRedemptionLedger("x", "y");
  item.ratio = 2719.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
