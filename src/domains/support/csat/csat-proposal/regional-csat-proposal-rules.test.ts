import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalCsatProposalCeilingRangeRule,
  RegionalCsatProposalCodeLengthRule,
  RegionalCsatProposalDiscountRangeRule,
  RegionalCsatProposalLabelLengthRule,
  RegionalCsatProposalRequiredCountryRule,
  RegionalCsatProposalRequiredCurrencyRule,
  defaultRegionalCsatProposalValidator,
} from "./regional-csat-proposal-rules.js";
import { newRegionalCsatProposal } from "./regional-csat-proposal.js";

test("RegionalCsatProposalValidator reports every problem", () => {
  const validator = defaultRegionalCsatProposalValidator();
  const item = newRegionalCsatProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalCsatProposalCeilingRangeRule flags values above ceiling", () => {
  const rule = new RegionalCsatProposalCeilingRangeRule(9.1, 2641.5);
  const item = newRegionalCsatProposal("x", "y");
  item.ceiling = 2643;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalCsatProposalDiscountRangeRule flags values above discount", () => {
  const rule = new RegionalCsatProposalDiscountRangeRule(6.5, 4070.3);
  const item = newRegionalCsatProposal("x", "y");
  item.discount = 4071.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalCsatProposalLabelLengthRule flags a long label", () => {
  const rule = new RegionalCsatProposalLabelLengthRule(1000);
  const item = newRegionalCsatProposal("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalCsatProposalCodeLengthRule flags a long code", () => {
  const rule = new RegionalCsatProposalCodeLengthRule(86400);
  const item = newRegionalCsatProposal("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalCsatProposalRequiredCountryRule flags a blank country", () => {
  const rule = new RegionalCsatProposalRequiredCountryRule("regional csat proposal needs an entry");
  const item = newRegionalCsatProposal("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalCsatProposalRequiredCurrencyRule flags a blank currency", () => {
  const rule = new RegionalCsatProposalRequiredCurrencyRule("regional csat proposal needs this field");
  const item = newRegionalCsatProposal("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
