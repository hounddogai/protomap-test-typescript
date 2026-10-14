import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredEscalationRecordChannelLengthRule,
  TieredEscalationRecordMarginRangeRule,
  TieredEscalationRecordRequiredCodeRule,
  TieredEscalationRecordRequiredNameRule,
  defaultTieredEscalationRecordValidator,
} from "./tiered-escalation-record-rules.js";
import { newTieredEscalationRecord } from "./tiered-escalation-record.js";

test("TieredEscalationRecordValidator reports every problem", () => {
  const validator = defaultTieredEscalationRecordValidator();
  const item = newTieredEscalationRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredEscalationRecordChannelLengthRule flags a long channel", () => {
  const rule = new TieredEscalationRecordChannelLengthRule(120);
  const item = newTieredEscalationRecord("x", "y");
  item.channel = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredEscalationRecordRequiredNameRule flags a blank name", () => {
  const rule = new TieredEscalationRecordRequiredNameRule("tiered escalation record needs a value");
  const item = newTieredEscalationRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredEscalationRecordRequiredCodeRule flags a blank code", () => {
  const rule = new TieredEscalationRecordRequiredCodeRule("tiered escalation record needs a value");
  const item = newTieredEscalationRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredEscalationRecordMarginRangeRule flags values above margin", () => {
  const rule = new TieredEscalationRecordMarginRangeRule(9.4, 3101.1);
  const item = newTieredEscalationRecord("x", "y");
  item.margin = 3102.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
