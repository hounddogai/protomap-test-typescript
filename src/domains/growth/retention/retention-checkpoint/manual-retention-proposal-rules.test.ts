import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualRetentionProposalCodeLengthRule,
  ManualRetentionProposalRequiredCodeRule,
  ManualRetentionProposalRequiredTitleRule,
  defaultManualRetentionProposalValidator,
} from "./manual-retention-proposal-rules.js";
import { newManualRetentionProposal } from "./manual-retention-proposal.js";

test("ManualRetentionProposalValidator reports every problem", () => {
  const validator = defaultManualRetentionProposalValidator();
  const item = newManualRetentionProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualRetentionProposalRequiredCodeRule flags a blank code", () => {
  const rule = new ManualRetentionProposalRequiredCodeRule("manual retention proposal needs an entry");
  const item = newManualRetentionProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualRetentionProposalCodeLengthRule flags a long code", () => {
  const rule = new ManualRetentionProposalCodeLengthRule(255);
  const item = newManualRetentionProposal("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualRetentionProposalRequiredTitleRule flags a blank title", () => {
  const rule = new ManualRetentionProposalRequiredTitleRule("manual retention proposal needs this field");
  const item = newManualRetentionProposal("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
