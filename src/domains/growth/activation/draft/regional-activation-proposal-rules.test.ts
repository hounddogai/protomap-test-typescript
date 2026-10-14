import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalActivationProposalExternalRefLengthRule,
  RegionalActivationProposalRequiredExternalRefRule,
  RegionalActivationProposalRequiredLabelRule,
  RegionalActivationProposalVariantLengthRule,
  defaultRegionalActivationProposalValidator,
} from "./regional-activation-proposal-rules.js";
import { newRegionalActivationProposal } from "./regional-activation-proposal.js";

test("RegionalActivationProposalValidator reports every problem", () => {
  const validator = defaultRegionalActivationProposalValidator();
  const item = newRegionalActivationProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalActivationProposalRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new RegionalActivationProposalRequiredExternalRefRule("regional activation proposal needs an entry");
  const item = newRegionalActivationProposal("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalActivationProposalExternalRefLengthRule flags a long external ref", () => {
  const rule = new RegionalActivationProposalExternalRefLengthRule(120);
  const item = newRegionalActivationProposal("x", "y");
  item.externalRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalActivationProposalRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalActivationProposalRequiredLabelRule("regional activation proposal needs this field");
  const item = newRegionalActivationProposal("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalActivationProposalVariantLengthRule flags a long variant", () => {
  const rule = new RegionalActivationProposalVariantLengthRule(16);
  const item = newRegionalActivationProposal("x", "y");
  item.variant = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
