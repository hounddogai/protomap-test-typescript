import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackPreferenceProposalChannelLengthRule,
  FallbackPreferenceProposalRequiredTitleRule,
  FallbackPreferenceProposalSequenceRangeRule,
  FallbackPreferenceProposalUpdatedAtRangeRule,
  defaultFallbackPreferenceProposalValidator,
} from "./fallback-preference-proposal-rules.js";
import { newFallbackPreferenceProposal } from "./fallback-preference-proposal.js";

test("FallbackPreferenceProposalValidator reports every problem", () => {
  const validator = defaultFallbackPreferenceProposalValidator();
  const item = newFallbackPreferenceProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackPreferenceProposalSequenceRangeRule flags values above sequence", () => {
  const rule = new FallbackPreferenceProposalSequenceRangeRule(255, 1000);
  const item = newFallbackPreferenceProposal("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPreferenceProposalUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new FallbackPreferenceProposalUpdatedAtRangeRule(64, 80);
  const item = newFallbackPreferenceProposal("x", "y");
  item.updatedAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPreferenceProposalChannelLengthRule flags a long channel", () => {
  const rule = new FallbackPreferenceProposalChannelLengthRule(32);
  const item = newFallbackPreferenceProposal("x", "y");
  item.channel = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackPreferenceProposalRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackPreferenceProposalRequiredTitleRule("fallback preference proposal needs this field");
  const item = newFallbackPreferenceProposal("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
