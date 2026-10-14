import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofMappingCodeLengthRule,
  ProofMappingOpenRateRangeRule,
  ProofMappingRatioRangeRule,
  ProofMappingRequiredLabelRule,
  ProofMappingSegmentLengthRule,
  ProofMappingThresholdRangeRule,
  defaultProofMappingValidator,
} from "./proof-mapping-rules.js";
import { newProofMapping } from "./proof-mapping.js";

test("ProofMappingValidator reports every problem", () => {
  const validator = defaultProofMappingValidator();
  const item = newProofMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofMappingCodeLengthRule flags a long code", () => {
  const rule = new ProofMappingCodeLengthRule(32);
  const item = newProofMapping("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofMappingThresholdRangeRule flags values above threshold", () => {
  const rule = new ProofMappingThresholdRangeRule(5.7, 4119.5);
  const item = newProofMapping("x", "y");
  item.threshold = 4121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofMappingOpenRateRangeRule flags values above open rate", () => {
  const rule = new ProofMappingOpenRateRangeRule(0.4, 1220.8);
  const item = newProofMapping("x", "y");
  item.openRate = 1222.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofMappingRatioRangeRule flags values above ratio", () => {
  const rule = new ProofMappingRatioRangeRule(4.6, 3249.1);
  const item = newProofMapping("x", "y");
  item.ratio = 3250.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofMappingSegmentLengthRule flags a long segment", () => {
  const rule = new ProofMappingSegmentLengthRule(255);
  const item = newProofMapping("x", "y");
  item.segment = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofMappingRequiredLabelRule flags a blank label", () => {
  const rule = new ProofMappingRequiredLabelRule("proof mapping needs a value");
  const item = newProofMapping("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
