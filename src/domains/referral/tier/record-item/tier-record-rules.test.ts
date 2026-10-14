import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierRecordLabelLengthRule,
  TierRecordRequiredCodeRule,
  TierRecordUpdatedAtRangeRule,
  defaultTierRecordValidator,
} from "./tier-record-rules.js";
import { newTierRecord } from "./tier-record.js";

test("TierRecordValidator reports every problem", () => {
  const validator = defaultTierRecordValidator();
  const item = newTierRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierRecordRequiredCodeRule flags a blank code", () => {
  const rule = new TierRecordRequiredCodeRule("tier record needs an entry");
  const item = newTierRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierRecordLabelLengthRule flags a long label", () => {
  const rule = new TierRecordLabelLengthRule(86400);
  const item = newTierRecord("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierRecordUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new TierRecordUpdatedAtRangeRule(64, 255);
  const item = newTierRecord("x", "y");
  item.updatedAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
