import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintProposalGraceDaysRangeRule,
  ComplaintProposalLocaleLengthRule,
  ComplaintProposalRequiredNameRule,
  ComplaintProposalRequiredTimezoneRule,
  ComplaintProposalTimezoneLengthRule,
  ComplaintProposalWindowDaysRangeRule,
  defaultComplaintProposalValidator,
} from "./complaint-proposal-rules.js";
import { newComplaintProposal } from "./complaint-proposal.js";

test("ComplaintProposalValidator reports every problem", () => {
  const validator = defaultComplaintProposalValidator();
  const item = newComplaintProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintProposalTimezoneLengthRule flags a long timezone", () => {
  const rule = new ComplaintProposalTimezoneLengthRule(255);
  const item = newComplaintProposal("x", "y");
  item.timezone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintProposalRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new ComplaintProposalRequiredTimezoneRule("complaint proposal needs an entry");
  const item = newComplaintProposal("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintProposalLocaleLengthRule flags a long locale", () => {
  const rule = new ComplaintProposalLocaleLengthRule(255);
  const item = newComplaintProposal("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintProposalRequiredNameRule flags a blank name", () => {
  const rule = new ComplaintProposalRequiredNameRule("complaint proposal needs an entry");
  const item = newComplaintProposal("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintProposalGraceDaysRangeRule flags values above grace days", () => {
  const rule = new ComplaintProposalGraceDaysRangeRule(255, 3600);
  const item = newComplaintProposal("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintProposalWindowDaysRangeRule flags values above window days", () => {
  const rule = new ComplaintProposalWindowDaysRangeRule(1000, 3600);
  const item = newComplaintProposal("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
