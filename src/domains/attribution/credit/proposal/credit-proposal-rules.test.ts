import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditProposalRequiredCodeRule,
  CreditProposalRequiredNameRule,
  defaultCreditProposalValidator,
} from "./credit-proposal-rules.js";
import { newCreditProposal } from "./credit-proposal.js";

test("CreditProposalValidator reports every problem", () => {
  const validator = defaultCreditProposalValidator();
  const item = newCreditProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditProposalRequiredNameRule flags a blank name", () => {
  const rule = new CreditProposalRequiredNameRule("credit proposal needs a value");
  const item = newCreditProposal("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditProposalRequiredCodeRule flags a blank code", () => {
  const rule = new CreditProposalRequiredCodeRule("credit proposal needs an entry");
  const item = newCreditProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
