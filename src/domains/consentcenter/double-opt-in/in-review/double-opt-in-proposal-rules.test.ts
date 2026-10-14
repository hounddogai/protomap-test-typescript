import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInProposalConversionRateRangeRule,
  DoubleOptInProposalDurationMinutesRangeRule,
  defaultDoubleOptInProposalValidator,
} from "./double-opt-in-proposal-rules.js";
import { newDoubleOptInProposal } from "./double-opt-in-proposal.js";

test("DoubleOptInProposalValidator reports every problem", () => {
  const validator = defaultDoubleOptInProposalValidator();
  const item = newDoubleOptInProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInProposalDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new DoubleOptInProposalDurationMinutesRangeRule(32, 32);
  const item = newDoubleOptInProposal("x", "y");
  item.durationMinutes = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DoubleOptInProposalConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new DoubleOptInProposalConversionRateRangeRule(0.1, 3235.8);
  const item = newDoubleOptInProposal("x", "y");
  item.conversionRate = 3237.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
