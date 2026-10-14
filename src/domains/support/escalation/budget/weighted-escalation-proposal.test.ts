import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedEscalationProposal } from "./weighted-escalation-proposal.js";

test("WeightedEscalationProposal starts in draft", () => {
  const item = newWeightedEscalationProposal("code-961", "title-780");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedEscalationProposal moves to active", () => {
  const item = newWeightedEscalationProposal("code-961", "title-780");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("WeightedEscalationProposal rejects moves from closed", () => {
  const item = newWeightedEscalationProposal("code-961", "title-780");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
