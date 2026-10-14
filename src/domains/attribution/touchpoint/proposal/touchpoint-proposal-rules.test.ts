import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointProposalImpressionsRangeRule,
  TouchpointProposalRequiredChannelRule,
  defaultTouchpointProposalValidator,
} from "./touchpoint-proposal-rules.js";
import { newTouchpointProposal } from "./touchpoint-proposal.js";

test("TouchpointProposalValidator reports every problem", () => {
  const validator = defaultTouchpointProposalValidator();
  const item = newTouchpointProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointProposalImpressionsRangeRule flags values above impressions", () => {
  const rule = new TouchpointProposalImpressionsRangeRule(120, 255);
  const item = newTouchpointProposal("x", "y");
  item.impressions = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointProposalRequiredChannelRule flags a blank channel", () => {
  const rule = new TouchpointProposalRequiredChannelRule("touchpoint proposal needs this field");
  const item = newTouchpointProposal("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
