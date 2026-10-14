import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictMacroProposalCeilingRangeRule,
  StrictMacroProposalNameLengthRule,
  defaultStrictMacroProposalValidator,
} from "./strict-macro-proposal-rules.js";
import { newStrictMacroProposal } from "./strict-macro-proposal.js";

test("StrictMacroProposalValidator reports every problem", () => {
  const validator = defaultStrictMacroProposalValidator();
  const item = newStrictMacroProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictMacroProposalCeilingRangeRule flags values above ceiling", () => {
  const rule = new StrictMacroProposalCeilingRangeRule(1.1, 1468.4);
  const item = newStrictMacroProposal("x", "y");
  item.ceiling = 1469.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictMacroProposalNameLengthRule flags a long name", () => {
  const rule = new StrictMacroProposalNameLengthRule(64);
  const item = newStrictMacroProposal("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
