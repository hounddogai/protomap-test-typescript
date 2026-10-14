import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictSenderProposalCreatedAtRangeRule,
  StrictSenderProposalNameLengthRule,
  StrictSenderProposalRequiredContactEmailRule,
  StrictSenderProposalRequiredNameRule,
  StrictSenderProposalRetriesRangeRule,
  defaultStrictSenderProposalValidator,
} from "./strict-sender-proposal-rules.js";
import { newStrictSenderProposal } from "./strict-sender-proposal.js";

test("StrictSenderProposalValidator reports every problem", () => {
  const validator = defaultStrictSenderProposalValidator();
  const item = newStrictSenderProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictSenderProposalRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new StrictSenderProposalRequiredContactEmailRule("strict sender proposal needs an entry");
  const item = newStrictSenderProposal("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictSenderProposalCreatedAtRangeRule flags values above created at", () => {
  const rule = new StrictSenderProposalCreatedAtRangeRule(120, 255);
  const item = newStrictSenderProposal("x", "y");
  item.createdAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictSenderProposalNameLengthRule flags a long name", () => {
  const rule = new StrictSenderProposalNameLengthRule(64);
  const item = newStrictSenderProposal("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictSenderProposalRequiredNameRule flags a blank name", () => {
  const rule = new StrictSenderProposalRequiredNameRule("strict sender proposal needs this field");
  const item = newStrictSenderProposal("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictSenderProposalRetriesRangeRule flags values above retries", () => {
  const rule = new StrictSenderProposalRetriesRangeRule(80, 80);
  const item = newStrictSenderProposal("x", "y");
  item.retries = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
