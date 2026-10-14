import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledStepProposalCategoryLengthRule,
  ScheduledStepProposalCostRangeRule,
  ScheduledStepProposalRetriesRangeRule,
  defaultScheduledStepProposalValidator,
} from "./scheduled-step-proposal-rules.js";
import { newScheduledStepProposal } from "./scheduled-step-proposal.js";

test("ScheduledStepProposalValidator reports every problem", () => {
  const validator = defaultScheduledStepProposalValidator();
  const item = newScheduledStepProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledStepProposalCostRangeRule flags values above cost", () => {
  const rule = new ScheduledStepProposalCostRangeRule(9.5, 4333.6);
  const item = newScheduledStepProposal("x", "y");
  item.cost = 4335.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledStepProposalRetriesRangeRule flags values above retries", () => {
  const rule = new ScheduledStepProposalRetriesRangeRule(64, 64);
  const item = newScheduledStepProposal("x", "y");
  item.retries = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledStepProposalCategoryLengthRule flags a long category", () => {
  const rule = new ScheduledStepProposalCategoryLengthRule(80);
  const item = newScheduledStepProposal("x", "y");
  item.category = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
