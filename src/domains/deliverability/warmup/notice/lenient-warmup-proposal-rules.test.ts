import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientWarmupProposalClicksRangeRule,
  LenientWarmupProposalLimitRangeRule,
  LenientWarmupProposalRequiredNameRule,
  LenientWarmupProposalThresholdRangeRule,
  defaultLenientWarmupProposalValidator,
} from "./lenient-warmup-proposal-rules.js";
import { newLenientWarmupProposal } from "./lenient-warmup-proposal.js";

test("LenientWarmupProposalValidator reports every problem", () => {
  const validator = defaultLenientWarmupProposalValidator();
  const item = newLenientWarmupProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientWarmupProposalClicksRangeRule flags values above clicks", () => {
  const rule = new LenientWarmupProposalClicksRangeRule(16, 16);
  const item = newLenientWarmupProposal("x", "y");
  item.clicks = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientWarmupProposalRequiredNameRule flags a blank name", () => {
  const rule = new LenientWarmupProposalRequiredNameRule("lenient warmup proposal needs this field");
  const item = newLenientWarmupProposal("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientWarmupProposalLimitRangeRule flags values above limit", () => {
  const rule = new LenientWarmupProposalLimitRangeRule(32, 80);
  const item = newLenientWarmupProposal("x", "y");
  item.limit = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientWarmupProposalThresholdRangeRule flags values above threshold", () => {
  const rule = new LenientWarmupProposalThresholdRangeRule(0.5, 2880.4);
  const item = newLenientWarmupProposal("x", "y");
  item.threshold = 2881.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
