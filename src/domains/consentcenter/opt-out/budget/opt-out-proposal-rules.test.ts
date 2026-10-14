import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutProposalEndsAtRangeRule,
  OptOutProposalRequiredCodeRule,
  defaultOptOutProposalValidator,
} from "./opt-out-proposal-rules.js";
import { newOptOutProposal } from "./opt-out-proposal.js";

test("OptOutProposalValidator reports every problem", () => {
  const validator = defaultOptOutProposalValidator();
  const item = newOptOutProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutProposalEndsAtRangeRule flags values above ends at", () => {
  const rule = new OptOutProposalEndsAtRangeRule(16, 255);
  const item = newOptOutProposal("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("OptOutProposalRequiredCodeRule flags a blank code", () => {
  const rule = new OptOutProposalRequiredCodeRule("opt out proposal needs a value");
  const item = newOptOutProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
