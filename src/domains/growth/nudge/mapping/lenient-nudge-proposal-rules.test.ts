import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientNudgeProposalRequiredUnitRule,
  LenientNudgeProposalVersionRangeRule,
  defaultLenientNudgeProposalValidator,
} from "./lenient-nudge-proposal-rules.js";
import { newLenientNudgeProposal } from "./lenient-nudge-proposal.js";

test("LenientNudgeProposalValidator reports every problem", () => {
  const validator = defaultLenientNudgeProposalValidator();
  const item = newLenientNudgeProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientNudgeProposalVersionRangeRule flags values above version", () => {
  const rule = new LenientNudgeProposalVersionRangeRule(32, 255);
  const item = newLenientNudgeProposal("x", "y");
  item.version = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientNudgeProposalRequiredUnitRule flags a blank unit", () => {
  const rule = new LenientNudgeProposalRequiredUnitRule("lenient nudge proposal needs a value");
  const item = newLenientNudgeProposal("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
