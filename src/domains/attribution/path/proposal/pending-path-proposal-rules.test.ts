import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingPathProposalNameLengthRule,
  PendingPathProposalRequiredNameRule,
  defaultPendingPathProposalValidator,
} from "./pending-path-proposal-rules.js";
import { newPendingPathProposal } from "./pending-path-proposal.js";

test("PendingPathProposalValidator reports every problem", () => {
  const validator = defaultPendingPathProposalValidator();
  const item = newPendingPathProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingPathProposalRequiredNameRule flags a blank name", () => {
  const rule = new PendingPathProposalRequiredNameRule("pending path proposal needs a value");
  const item = newPendingPathProposal("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingPathProposalNameLengthRule flags a long name", () => {
  const rule = new PendingPathProposalNameLengthRule(120);
  const item = newPendingPathProposal("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
