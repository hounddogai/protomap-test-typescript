import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainProposalRequiredSourceRule,
  DomainProposalRequiredTitleRule,
  DomainProposalWindowDaysRangeRule,
  defaultDomainProposalValidator,
} from "./domain-proposal-rules.js";
import { newDomainProposal } from "./domain-proposal.js";

test("DomainProposalValidator reports every problem", () => {
  const validator = defaultDomainProposalValidator();
  const item = newDomainProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainProposalRequiredTitleRule flags a blank title", () => {
  const rule = new DomainProposalRequiredTitleRule("domain proposal needs this field");
  const item = newDomainProposal("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainProposalWindowDaysRangeRule flags values above window days", () => {
  const rule = new DomainProposalWindowDaysRangeRule(120, 3600);
  const item = newDomainProposal("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainProposalRequiredSourceRule flags a blank source", () => {
  const rule = new DomainProposalRequiredSourceRule("domain proposal needs an entry");
  const item = newDomainProposal("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
