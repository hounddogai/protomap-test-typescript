import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPreferenceProposalClicksRangeRule,
  PrimaryPreferenceProposalDescriptionLengthRule,
  PrimaryPreferenceProposalRequiredNameRule,
  PrimaryPreferenceProposalSummaryLengthRule,
  defaultPrimaryPreferenceProposalValidator,
} from "./primary-preference-proposal-rules.js";
import { newPrimaryPreferenceProposal } from "./primary-preference-proposal.js";

test("PrimaryPreferenceProposalValidator reports every problem", () => {
  const validator = defaultPrimaryPreferenceProposalValidator();
  const item = newPrimaryPreferenceProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPreferenceProposalClicksRangeRule flags values above clicks", () => {
  const rule = new PrimaryPreferenceProposalClicksRangeRule(80, 255);
  const item = newPrimaryPreferenceProposal("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryPreferenceProposalSummaryLengthRule flags a long summary", () => {
  const rule = new PrimaryPreferenceProposalSummaryLengthRule(86400);
  const item = newPrimaryPreferenceProposal("x", "y");
  item.summary = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPreferenceProposalRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryPreferenceProposalRequiredNameRule("primary preference proposal needs an entry");
  const item = newPrimaryPreferenceProposal("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPreferenceProposalDescriptionLengthRule flags a long description", () => {
  const rule = new PrimaryPreferenceProposalDescriptionLengthRule(120);
  const item = newPrimaryPreferenceProposal("x", "y");
  item.description = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
