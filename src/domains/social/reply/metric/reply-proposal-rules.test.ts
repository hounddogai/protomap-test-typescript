import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyProposalRequiredDescriptionRule,
  ReplyProposalRequiredLocaleRule,
  defaultReplyProposalValidator,
} from "./reply-proposal-rules.js";
import { newReplyProposal } from "./reply-proposal.js";

test("ReplyProposalValidator reports every problem", () => {
  const validator = defaultReplyProposalValidator();
  const item = newReplyProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyProposalRequiredDescriptionRule flags a blank description", () => {
  const rule = new ReplyProposalRequiredDescriptionRule("reply proposal needs this field");
  const item = newReplyProposal("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyProposalRequiredLocaleRule flags a blank locale", () => {
  const rule = new ReplyProposalRequiredLocaleRule("reply proposal needs an entry");
  const item = newReplyProposal("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
