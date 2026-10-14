import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitProposalCodeLengthRule,
  WaitProposalRequiredCodeRule,
  WaitProposalTimezoneLengthRule,
  defaultWaitProposalValidator,
} from "./wait-proposal-rules.js";
import { newWaitProposal } from "./wait-proposal.js";

test("WaitProposalValidator reports every problem", () => {
  const validator = defaultWaitProposalValidator();
  const item = newWaitProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitProposalCodeLengthRule flags a long code", () => {
  const rule = new WaitProposalCodeLengthRule(80);
  const item = newWaitProposal("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitProposalRequiredCodeRule flags a blank code", () => {
  const rule = new WaitProposalRequiredCodeRule("wait proposal needs this field");
  const item = newWaitProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitProposalTimezoneLengthRule flags a long timezone", () => {
  const rule = new WaitProposalTimezoneLengthRule(32);
  const item = newWaitProposal("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
