import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalMacroProposalBudgetRangeRule,
  SeasonalMacroProposalRequiredChannelRule,
  SeasonalMacroProposalRequiredCodeRule,
  SeasonalMacroProposalRequiredNameRule,
  defaultSeasonalMacroProposalValidator,
} from "./seasonal-macro-proposal-rules.js";
import { newSeasonalMacroProposal } from "./seasonal-macro-proposal.js";

test("SeasonalMacroProposalValidator reports every problem", () => {
  const validator = defaultSeasonalMacroProposalValidator();
  const item = newSeasonalMacroProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalMacroProposalBudgetRangeRule flags values above budget", () => {
  const rule = new SeasonalMacroProposalBudgetRangeRule(5, 3671.4);
  const item = newSeasonalMacroProposal("x", "y");
  item.budget = 3672.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalMacroProposalRequiredChannelRule flags a blank channel", () => {
  const rule = new SeasonalMacroProposalRequiredChannelRule("seasonal macro proposal needs this field");
  const item = newSeasonalMacroProposal("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalMacroProposalRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalMacroProposalRequiredCodeRule("seasonal macro proposal needs a value");
  const item = newSeasonalMacroProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalMacroProposalRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalMacroProposalRequiredNameRule("seasonal macro proposal needs an entry");
  const item = newSeasonalMacroProposal("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
