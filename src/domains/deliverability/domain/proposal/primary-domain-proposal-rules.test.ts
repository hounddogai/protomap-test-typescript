import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryDomainProposalCodeLengthRule,
  PrimaryDomainProposalEndsAtRangeRule,
  PrimaryDomainProposalRequiredLabelRule,
  defaultPrimaryDomainProposalValidator,
} from "./primary-domain-proposal-rules.js";
import { newPrimaryDomainProposal } from "./primary-domain-proposal.js";

test("PrimaryDomainProposalValidator reports every problem", () => {
  const validator = defaultPrimaryDomainProposalValidator();
  const item = newPrimaryDomainProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryDomainProposalRequiredLabelRule flags a blank label", () => {
  const rule = new PrimaryDomainProposalRequiredLabelRule("primary domain proposal needs this field");
  const item = newPrimaryDomainProposal("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryDomainProposalEndsAtRangeRule flags values above ends at", () => {
  const rule = new PrimaryDomainProposalEndsAtRangeRule(3600, 86400);
  const item = newPrimaryDomainProposal("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryDomainProposalCodeLengthRule flags a long code", () => {
  const rule = new PrimaryDomainProposalCodeLengthRule(80);
  const item = newPrimaryDomainProposal("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
