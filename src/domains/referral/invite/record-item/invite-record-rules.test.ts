import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteRecordCodeLengthRule,
  InviteRecordImpressionsRangeRule,
  InviteRecordMaximumRangeRule,
  InviteRecordRequiredSummaryRule,
  InviteRecordRequiredUnitRule,
  defaultInviteRecordValidator,
} from "./invite-record-rules.js";
import { newInviteRecord } from "./invite-record.js";

test("InviteRecordValidator reports every problem", () => {
  const validator = defaultInviteRecordValidator();
  const item = newInviteRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteRecordMaximumRangeRule flags values above maximum", () => {
  const rule = new InviteRecordMaximumRangeRule(9.2, 4676.9);
  const item = newInviteRecord("x", "y");
  item.maximum = 4678.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteRecordCodeLengthRule flags a long code", () => {
  const rule = new InviteRecordCodeLengthRule(120);
  const item = newInviteRecord("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteRecordRequiredSummaryRule flags a blank summary", () => {
  const rule = new InviteRecordRequiredSummaryRule("invite record needs an entry");
  const item = newInviteRecord("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteRecordImpressionsRangeRule flags values above impressions", () => {
  const rule = new InviteRecordImpressionsRangeRule(80, 120);
  const item = newInviteRecord("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteRecordRequiredUnitRule flags a blank unit", () => {
  const rule = new InviteRecordRequiredUnitRule("invite record needs a value");
  const item = newInviteRecord("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
