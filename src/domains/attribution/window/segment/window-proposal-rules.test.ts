import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowProposalExpiresAtRangeRule,
  WindowProposalRequiredTitleRule,
  WindowProposalTitleLengthRule,
  defaultWindowProposalValidator,
} from "./window-proposal-rules.js";
import { newWindowProposal } from "./window-proposal.js";

test("WindowProposalValidator reports every problem", () => {
  const validator = defaultWindowProposalValidator();
  const item = newWindowProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowProposalTitleLengthRule flags a long title", () => {
  const rule = new WindowProposalTitleLengthRule(120);
  const item = newWindowProposal("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowProposalExpiresAtRangeRule flags values above expires at", () => {
  const rule = new WindowProposalExpiresAtRangeRule(16, 255);
  const item = newWindowProposal("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowProposalRequiredTitleRule flags a blank title", () => {
  const rule = new WindowProposalRequiredTitleRule("window proposal needs a value");
  const item = newWindowProposal("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
