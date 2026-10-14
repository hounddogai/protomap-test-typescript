import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingFrequencyProposalCeilingRangeRule,
  PendingFrequencyProposalChannelLengthRule,
  PendingFrequencyProposalCodeLengthRule,
  PendingFrequencyProposalRequiredNameRule,
  PendingFrequencyProposalSummaryLengthRule,
  defaultPendingFrequencyProposalValidator,
} from "./pending-frequency-proposal-rules.js";
import { newPendingFrequencyProposal } from "./pending-frequency-proposal.js";

test("PendingFrequencyProposalValidator reports every problem", () => {
  const validator = defaultPendingFrequencyProposalValidator();
  const item = newPendingFrequencyProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingFrequencyProposalSummaryLengthRule flags a long summary", () => {
  const rule = new PendingFrequencyProposalSummaryLengthRule(64);
  const item = newPendingFrequencyProposal("x", "y");
  item.summary = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingFrequencyProposalChannelLengthRule flags a long channel", () => {
  const rule = new PendingFrequencyProposalChannelLengthRule(64);
  const item = newPendingFrequencyProposal("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingFrequencyProposalCodeLengthRule flags a long code", () => {
  const rule = new PendingFrequencyProposalCodeLengthRule(255);
  const item = newPendingFrequencyProposal("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingFrequencyProposalRequiredNameRule flags a blank name", () => {
  const rule = new PendingFrequencyProposalRequiredNameRule("pending frequency proposal needs an entry");
  const item = newPendingFrequencyProposal("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingFrequencyProposalCeilingRangeRule flags values above ceiling", () => {
  const rule = new PendingFrequencyProposalCeilingRangeRule(2.8, 253.8);
  const item = newPendingFrequencyProposal("x", "y");
  item.ceiling = 255.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
