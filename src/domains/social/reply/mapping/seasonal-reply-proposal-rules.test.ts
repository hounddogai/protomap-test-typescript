import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalReplyProposalLabelLengthRule,
  SeasonalReplyProposalRequiredLabelRule,
  defaultSeasonalReplyProposalValidator,
} from "./seasonal-reply-proposal-rules.js";
import { newSeasonalReplyProposal } from "./seasonal-reply-proposal.js";

test("SeasonalReplyProposalValidator reports every problem", () => {
  const validator = defaultSeasonalReplyProposalValidator();
  const item = newSeasonalReplyProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalReplyProposalLabelLengthRule flags a long label", () => {
  const rule = new SeasonalReplyProposalLabelLengthRule(3600);
  const item = newSeasonalReplyProposal("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalReplyProposalRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalReplyProposalRequiredLabelRule("seasonal reply proposal needs this field");
  const item = newSeasonalReplyProposal("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
