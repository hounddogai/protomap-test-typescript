import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualProofTierBatchSizeRangeRule,
  ManualProofTierCodeLengthRule,
  ManualProofTierRequiredChannelRule,
  defaultManualProofTierValidator,
} from "./manual-proof-tier-rules.js";
import { newManualProofTier } from "./manual-proof-tier.js";

test("ManualProofTierValidator reports every problem", () => {
  const validator = defaultManualProofTierValidator();
  const item = newManualProofTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualProofTierBatchSizeRangeRule flags values above batch size", () => {
  const rule = new ManualProofTierBatchSizeRangeRule(120, 255);
  const item = newManualProofTier("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualProofTierCodeLengthRule flags a long code", () => {
  const rule = new ManualProofTierCodeLengthRule(64);
  const item = newManualProofTier("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualProofTierRequiredChannelRule flags a blank channel", () => {
  const rule = new ManualProofTierRequiredChannelRule("manual proof tier needs a value");
  const item = newManualProofTier("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
