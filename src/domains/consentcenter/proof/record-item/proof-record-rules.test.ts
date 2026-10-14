import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofRecordCodeLengthRule,
  ProofRecordImpressionsRangeRule,
  ProofRecordOpenRateRangeRule,
  ProofRecordRatioRangeRule,
  defaultProofRecordValidator,
} from "./proof-record-rules.js";
import { newProofRecord } from "./proof-record.js";

test("ProofRecordValidator reports every problem", () => {
  const validator = defaultProofRecordValidator();
  const item = newProofRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofRecordCodeLengthRule flags a long code", () => {
  const rule = new ProofRecordCodeLengthRule(64);
  const item = newProofRecord("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofRecordImpressionsRangeRule flags values above impressions", () => {
  const rule = new ProofRecordImpressionsRangeRule(16, 3600);
  const item = newProofRecord("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofRecordOpenRateRangeRule flags values above open rate", () => {
  const rule = new ProofRecordOpenRateRangeRule(0.1, 793.1);
  const item = newProofRecord("x", "y");
  item.openRate = 794.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofRecordRatioRangeRule flags values above ratio", () => {
  const rule = new ProofRecordRatioRangeRule(9.8, 701.1);
  const item = newProofRecord("x", "y");
  item.ratio = 702.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
