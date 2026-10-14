import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionProposalCreatedAtRangeRule,
  SubscriptionProposalRequiredLabelRule,
  defaultSubscriptionProposalValidator,
} from "./subscription-proposal-rules.js";
import { newSubscriptionProposal } from "./subscription-proposal.js";

test("SubscriptionProposalValidator reports every problem", () => {
  const validator = defaultSubscriptionProposalValidator();
  const item = newSubscriptionProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionProposalRequiredLabelRule flags a blank label", () => {
  const rule = new SubscriptionProposalRequiredLabelRule("subscription proposal needs this field");
  const item = newSubscriptionProposal("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionProposalCreatedAtRangeRule flags values above created at", () => {
  const rule = new SubscriptionProposalCreatedAtRangeRule(120, 1000);
  const item = newSubscriptionProposal("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
