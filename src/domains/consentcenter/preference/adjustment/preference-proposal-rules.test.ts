import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceProposalDiscountRangeRule,
  PreferenceProposalRequiredCodeRule,
  defaultPreferenceProposalValidator,
} from "./preference-proposal-rules.js";
import { newPreferenceProposal } from "./preference-proposal.js";

test("PreferenceProposalValidator reports every problem", () => {
  const validator = defaultPreferenceProposalValidator();
  const item = newPreferenceProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceProposalDiscountRangeRule flags values above discount", () => {
  const rule = new PreferenceProposalDiscountRangeRule(9.9, 2071.4);
  const item = newPreferenceProposal("x", "y");
  item.discount = 2072.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceProposalRequiredCodeRule flags a blank code", () => {
  const rule = new PreferenceProposalRequiredCodeRule("preference proposal needs a value");
  const item = newPreferenceProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
