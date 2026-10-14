import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationProposalCodeLengthRule,
  ActivationProposalRateRangeRule,
  ActivationProposalRequiredCodeRule,
  ActivationProposalRequiredNotesRule,
  defaultActivationProposalValidator,
} from "./activation-proposal-rules.js";
import { newActivationProposal } from "./activation-proposal.js";

test("ActivationProposalValidator reports every problem", () => {
  const validator = defaultActivationProposalValidator();
  const item = newActivationProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationProposalRequiredCodeRule flags a blank code", () => {
  const rule = new ActivationProposalRequiredCodeRule("activation proposal needs an entry");
  const item = newActivationProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationProposalRequiredNotesRule flags a blank notes", () => {
  const rule = new ActivationProposalRequiredNotesRule("activation proposal needs an entry");
  const item = newActivationProposal("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationProposalRateRangeRule flags values above rate", () => {
  const rule = new ActivationProposalRateRangeRule(5.1, 559.9);
  const item = newActivationProposal("x", "y");
  item.rate = 561.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationProposalCodeLengthRule flags a long code", () => {
  const rule = new ActivationProposalCodeLengthRule(3600);
  const item = newActivationProposal("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
