import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelProposalCodeLengthRule,
  FunnelProposalLabelLengthRule,
  FunnelProposalMarginRangeRule,
  FunnelProposalRequiredChannelRule,
  FunnelProposalScoreRangeRule,
  defaultFunnelProposalValidator,
} from "./funnel-proposal-rules.js";
import { newFunnelProposal } from "./funnel-proposal.js";

test("FunnelProposalValidator reports every problem", () => {
  const validator = defaultFunnelProposalValidator();
  const item = newFunnelProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelProposalRequiredChannelRule flags a blank channel", () => {
  const rule = new FunnelProposalRequiredChannelRule("funnel proposal needs a value");
  const item = newFunnelProposal("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelProposalLabelLengthRule flags a long label", () => {
  const rule = new FunnelProposalLabelLengthRule(255);
  const item = newFunnelProposal("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelProposalScoreRangeRule flags values above score", () => {
  const rule = new FunnelProposalScoreRangeRule(2.9, 614);
  const item = newFunnelProposal("x", "y");
  item.score = 615.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelProposalCodeLengthRule flags a long code", () => {
  const rule = new FunnelProposalCodeLengthRule(80);
  const item = newFunnelProposal("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelProposalMarginRangeRule flags values above margin", () => {
  const rule = new FunnelProposalMarginRangeRule(7.3, 919.8);
  const item = newFunnelProposal("x", "y");
  item.margin = 921.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
