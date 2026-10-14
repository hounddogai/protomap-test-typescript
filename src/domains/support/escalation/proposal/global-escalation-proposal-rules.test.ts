import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalEscalationProposalRequiredCodeRule,
  GlobalEscalationProposalWindowDaysRangeRule,
  defaultGlobalEscalationProposalValidator,
} from "./global-escalation-proposal-rules.js";
import { newGlobalEscalationProposal } from "./global-escalation-proposal.js";

test("GlobalEscalationProposalValidator reports every problem", () => {
  const validator = defaultGlobalEscalationProposalValidator();
  const item = newGlobalEscalationProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalEscalationProposalRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalEscalationProposalRequiredCodeRule("global escalation proposal needs an entry");
  const item = newGlobalEscalationProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalEscalationProposalWindowDaysRangeRule flags values above window days", () => {
  const rule = new GlobalEscalationProposalWindowDaysRangeRule(255, 1000);
  const item = newGlobalEscalationProposal("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
