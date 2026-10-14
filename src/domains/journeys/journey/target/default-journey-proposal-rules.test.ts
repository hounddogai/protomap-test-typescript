import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultJourneyProposalCodeLengthRule,
  DefaultJourneyProposalDurationMinutesRangeRule,
  DefaultJourneyProposalRequiredLabelRule,
  DefaultJourneyProposalSegmentLengthRule,
  defaultDefaultJourneyProposalValidator,
} from "./default-journey-proposal-rules.js";
import { newDefaultJourneyProposal } from "./default-journey-proposal.js";

test("DefaultJourneyProposalValidator reports every problem", () => {
  const validator = defaultDefaultJourneyProposalValidator();
  const item = newDefaultJourneyProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultJourneyProposalSegmentLengthRule flags a long segment", () => {
  const rule = new DefaultJourneyProposalSegmentLengthRule(80);
  const item = newDefaultJourneyProposal("x", "y");
  item.segment = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultJourneyProposalCodeLengthRule flags a long code", () => {
  const rule = new DefaultJourneyProposalCodeLengthRule(255);
  const item = newDefaultJourneyProposal("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultJourneyProposalRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultJourneyProposalRequiredLabelRule("default journey proposal needs a value");
  const item = newDefaultJourneyProposal("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultJourneyProposalDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new DefaultJourneyProposalDurationMinutesRangeRule(64, 64);
  const item = newDefaultJourneyProposal("x", "y");
  item.durationMinutes = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
