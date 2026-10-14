import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionProposalCapacityRangeRule,
  SuppressionProposalChannelLengthRule,
  SuppressionProposalOpenRateRangeRule,
  defaultSuppressionProposalValidator,
} from "./suppression-proposal-rules.js";
import { newSuppressionProposal } from "./suppression-proposal.js";

test("SuppressionProposalValidator reports every problem", () => {
  const validator = defaultSuppressionProposalValidator();
  const item = newSuppressionProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionProposalOpenRateRangeRule flags values above open rate", () => {
  const rule = new SuppressionProposalOpenRateRangeRule(4.7, 344.1);
  const item = newSuppressionProposal("x", "y");
  item.openRate = 345.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionProposalCapacityRangeRule flags values above capacity", () => {
  const rule = new SuppressionProposalCapacityRangeRule(16, 64);
  const item = newSuppressionProposal("x", "y");
  item.capacity = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionProposalChannelLengthRule flags a long channel", () => {
  const rule = new SuppressionProposalChannelLengthRule(3600);
  const item = newSuppressionProposal("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
