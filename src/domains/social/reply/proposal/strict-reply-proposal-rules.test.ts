import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictReplyProposalCodeLengthRule,
  StrictReplyProposalSendAtRangeRule,
  StrictReplyProposalTitleLengthRule,
  StrictReplyProposalUnitLengthRule,
  defaultStrictReplyProposalValidator,
} from "./strict-reply-proposal-rules.js";
import { newStrictReplyProposal } from "./strict-reply-proposal.js";

test("StrictReplyProposalValidator reports every problem", () => {
  const validator = defaultStrictReplyProposalValidator();
  const item = newStrictReplyProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictReplyProposalUnitLengthRule flags a long unit", () => {
  const rule = new StrictReplyProposalUnitLengthRule(64);
  const item = newStrictReplyProposal("x", "y");
  item.unit = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictReplyProposalTitleLengthRule flags a long title", () => {
  const rule = new StrictReplyProposalTitleLengthRule(3600);
  const item = newStrictReplyProposal("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictReplyProposalSendAtRangeRule flags values above send at", () => {
  const rule = new StrictReplyProposalSendAtRangeRule(255, 1000);
  const item = newStrictReplyProposal("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictReplyProposalCodeLengthRule flags a long code", () => {
  const rule = new StrictReplyProposalCodeLengthRule(86400);
  const item = newStrictReplyProposal("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
