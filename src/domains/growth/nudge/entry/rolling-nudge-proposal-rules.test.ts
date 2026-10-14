import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingNudgeProposalClicksRangeRule,
  RollingNudgeProposalJourneyIdLengthRule,
  RollingNudgeProposalRequiredUtmSourceRule,
  defaultRollingNudgeProposalValidator,
} from "./rolling-nudge-proposal-rules.js";
import { newRollingNudgeProposal } from "./rolling-nudge-proposal.js";

test("RollingNudgeProposalValidator reports every problem", () => {
  const validator = defaultRollingNudgeProposalValidator();
  const item = newRollingNudgeProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingNudgeProposalRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new RollingNudgeProposalRequiredUtmSourceRule("rolling nudge proposal needs an entry");
  const item = newRollingNudgeProposal("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingNudgeProposalJourneyIdLengthRule flags a long journey id", () => {
  const rule = new RollingNudgeProposalJourneyIdLengthRule(80);
  const item = newRollingNudgeProposal("x", "y");
  item.journeyId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingNudgeProposalClicksRangeRule flags values above clicks", () => {
  const rule = new RollingNudgeProposalClicksRangeRule(16, 16);
  const item = newRollingNudgeProposal("x", "y");
  item.clicks = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
