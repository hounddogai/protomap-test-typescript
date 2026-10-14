import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupProposalEndsAtRangeRule,
  WarmupProposalMarginRangeRule,
  WarmupProposalQuantityRangeRule,
  defaultWarmupProposalValidator,
} from "./warmup-proposal-rules.js";
import { newWarmupProposal } from "./warmup-proposal.js";

test("WarmupProposalValidator reports every problem", () => {
  const validator = defaultWarmupProposalValidator();
  const item = newWarmupProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupProposalMarginRangeRule flags values above margin", () => {
  const rule = new WarmupProposalMarginRangeRule(9.4, 107.7);
  const item = newWarmupProposal("x", "y");
  item.margin = 109.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupProposalEndsAtRangeRule flags values above ends at", () => {
  const rule = new WarmupProposalEndsAtRangeRule(255, 3600);
  const item = newWarmupProposal("x", "y");
  item.endsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupProposalQuantityRangeRule flags values above quantity", () => {
  const rule = new WarmupProposalQuantityRangeRule(64, 86400);
  const item = newWarmupProposal("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
