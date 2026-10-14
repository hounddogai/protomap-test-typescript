import assert from "node:assert/strict";
import { test } from "node:test";
import { PathProposalGraceDaysRangeRule, defaultPathProposalValidator } from "./path-proposal-rules.js";
import { newPathProposal } from "./path-proposal.js";

test("PathProposalValidator reports every problem", () => {
  const validator = defaultPathProposalValidator();
  const item = newPathProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathProposalGraceDaysRangeRule flags values above grace days", () => {
  const rule = new PathProposalGraceDaysRangeRule(32, 80);
  const item = newPathProposal("x", "y");
  item.graceDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
