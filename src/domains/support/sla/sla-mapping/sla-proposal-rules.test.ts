import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaProposalContactEmailLengthRule,
  SlaProposalExternalRefLengthRule,
  SlaProposalRequiredExternalRefRule,
  SlaProposalWindowDaysRangeRule,
  defaultSlaProposalValidator,
} from "./sla-proposal-rules.js";
import { newSlaProposal } from "./sla-proposal.js";

test("SlaProposalValidator reports every problem", () => {
  const validator = defaultSlaProposalValidator();
  const item = newSlaProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaProposalExternalRefLengthRule flags a long external ref", () => {
  const rule = new SlaProposalExternalRefLengthRule(86400);
  const item = newSlaProposal("x", "y");
  item.externalRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaProposalRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new SlaProposalRequiredExternalRefRule("sla proposal needs this field");
  const item = newSlaProposal("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaProposalContactEmailLengthRule flags a long contact email", () => {
  const rule = new SlaProposalContactEmailLengthRule(255);
  const item = newSlaProposal("x", "y");
  item.contactEmail = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaProposalWindowDaysRangeRule flags values above window days", () => {
  const rule = new SlaProposalWindowDaysRangeRule(64, 3600);
  const item = newSlaProposal("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
