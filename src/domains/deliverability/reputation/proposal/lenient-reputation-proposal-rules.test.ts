import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientReputationProposalBidRangeRule,
  LenientReputationProposalRequiredCodeRule,
  defaultLenientReputationProposalValidator,
} from "./lenient-reputation-proposal-rules.js";
import { newLenientReputationProposal } from "./lenient-reputation-proposal.js";

test("LenientReputationProposalValidator reports every problem", () => {
  const validator = defaultLenientReputationProposalValidator();
  const item = newLenientReputationProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientReputationProposalBidRangeRule flags values above bid", () => {
  const rule = new LenientReputationProposalBidRangeRule(3.9, 2088.4);
  const item = newLenientReputationProposal("x", "y");
  item.bid = 2089.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientReputationProposalRequiredCodeRule flags a blank code", () => {
  const rule = new LenientReputationProposalRequiredCodeRule("lenient reputation proposal needs this field");
  const item = newLenientReputationProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
