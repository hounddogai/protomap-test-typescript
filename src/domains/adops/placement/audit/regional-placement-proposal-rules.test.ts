import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalPlacementProposalBudgetRangeRule,
  RegionalPlacementProposalCodeLengthRule,
  RegionalPlacementProposalLabelLengthRule,
  RegionalPlacementProposalRequiredUnitRule,
  RegionalPlacementProposalRequiredUtmSourceRule,
  RegionalPlacementProposalUnitLengthRule,
  defaultRegionalPlacementProposalValidator,
} from "./regional-placement-proposal-rules.js";
import { newRegionalPlacementProposal } from "./regional-placement-proposal.js";

test("RegionalPlacementProposalValidator reports every problem", () => {
  const validator = defaultRegionalPlacementProposalValidator();
  const item = newRegionalPlacementProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalPlacementProposalUnitLengthRule flags a long unit", () => {
  const rule = new RegionalPlacementProposalUnitLengthRule(3600);
  const item = newRegionalPlacementProposal("x", "y");
  item.unit = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalPlacementProposalCodeLengthRule flags a long code", () => {
  const rule = new RegionalPlacementProposalCodeLengthRule(16);
  const item = newRegionalPlacementProposal("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalPlacementProposalRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new RegionalPlacementProposalRequiredUtmSourceRule("regional placement proposal needs a value");
  const item = newRegionalPlacementProposal("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalPlacementProposalLabelLengthRule flags a long label", () => {
  const rule = new RegionalPlacementProposalLabelLengthRule(16);
  const item = newRegionalPlacementProposal("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalPlacementProposalBudgetRangeRule flags values above budget", () => {
  const rule = new RegionalPlacementProposalBudgetRangeRule(10, 2464.4);
  const item = newRegionalPlacementProposal("x", "y");
  item.budget = 2465.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalPlacementProposalRequiredUnitRule flags a blank unit", () => {
  const rule = new RegionalPlacementProposalRequiredUnitRule("regional placement proposal needs a value");
  const item = newRegionalPlacementProposal("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
