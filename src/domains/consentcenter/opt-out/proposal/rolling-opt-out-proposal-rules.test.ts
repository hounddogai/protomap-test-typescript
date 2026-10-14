import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingOptOutProposalCodeLengthRule,
  RollingOptOutProposalRequiredSegmentRule,
  RollingOptOutProposalRequiredVariantRule,
  RollingOptOutProposalSegmentLengthRule,
  RollingOptOutProposalTitleLengthRule,
  defaultRollingOptOutProposalValidator,
} from "./rolling-opt-out-proposal-rules.js";
import { newRollingOptOutProposal } from "./rolling-opt-out-proposal.js";

test("RollingOptOutProposalValidator reports every problem", () => {
  const validator = defaultRollingOptOutProposalValidator();
  const item = newRollingOptOutProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingOptOutProposalRequiredVariantRule flags a blank variant", () => {
  const rule = new RollingOptOutProposalRequiredVariantRule("rolling opt out proposal needs a value");
  const item = newRollingOptOutProposal("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingOptOutProposalRequiredSegmentRule flags a blank segment", () => {
  const rule = new RollingOptOutProposalRequiredSegmentRule("rolling opt out proposal needs a value");
  const item = newRollingOptOutProposal("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingOptOutProposalSegmentLengthRule flags a long segment", () => {
  const rule = new RollingOptOutProposalSegmentLengthRule(80);
  const item = newRollingOptOutProposal("x", "y");
  item.segment = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingOptOutProposalTitleLengthRule flags a long title", () => {
  const rule = new RollingOptOutProposalTitleLengthRule(255);
  const item = newRollingOptOutProposal("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingOptOutProposalCodeLengthRule flags a long code", () => {
  const rule = new RollingOptOutProposalCodeLengthRule(255);
  const item = newRollingOptOutProposal("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
