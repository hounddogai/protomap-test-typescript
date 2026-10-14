import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofAdjustmentAttemptsRangeRule,
  ProofAdjustmentCodeLengthRule,
  ProofAdjustmentRequiredTitleRule,
  ProofAdjustmentScoreRangeRule,
  ProofAdjustmentTitleLengthRule,
  defaultProofAdjustmentValidator,
} from "./proof-adjustment-rules.js";
import { newProofAdjustment } from "./proof-adjustment.js";

test("ProofAdjustmentValidator reports every problem", () => {
  const validator = defaultProofAdjustmentValidator();
  const item = newProofAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofAdjustmentTitleLengthRule flags a long title", () => {
  const rule = new ProofAdjustmentTitleLengthRule(16);
  const item = newProofAdjustment("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofAdjustmentScoreRangeRule flags values above score", () => {
  const rule = new ProofAdjustmentScoreRangeRule(1.9, 3840.7);
  const item = newProofAdjustment("x", "y");
  item.score = 3842.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new ProofAdjustmentCodeLengthRule(255);
  const item = newProofAdjustment("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new ProofAdjustmentRequiredTitleRule("proof adjustment needs a value");
  const item = newProofAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofAdjustmentAttemptsRangeRule flags values above attempts", () => {
  const rule = new ProofAdjustmentAttemptsRangeRule(120, 120);
  const item = newProofAdjustment("x", "y");
  item.attempts = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
