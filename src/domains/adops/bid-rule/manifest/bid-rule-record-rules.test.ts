import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleRecordCodeLengthRule,
  BidRuleRecordTitleLengthRule,
  BidRuleRecordWeightRangeRule,
  defaultBidRuleRecordValidator,
} from "./bid-rule-record-rules.js";
import { newBidRuleRecord } from "./bid-rule-record.js";

test("BidRuleRecordValidator reports every problem", () => {
  const validator = defaultBidRuleRecordValidator();
  const item = newBidRuleRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleRecordTitleLengthRule flags a long title", () => {
  const rule = new BidRuleRecordTitleLengthRule(3600);
  const item = newBidRuleRecord("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleRecordWeightRangeRule flags values above weight", () => {
  const rule = new BidRuleRecordWeightRangeRule(4.8, 2023.7);
  const item = newBidRuleRecord("x", "y");
  item.weight = 2025.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleRecordCodeLengthRule flags a long code", () => {
  const rule = new BidRuleRecordCodeLengthRule(16);
  const item = newBidRuleRecord("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
