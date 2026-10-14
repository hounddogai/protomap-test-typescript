import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedSuppressionProposal } from "./capped-suppression-proposal.js";

test("CappedSuppressionProposal starts in created", () => {
  const item = newCappedSuppressionProposal("code-977", "label-938");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedSuppressionProposal moves to validated", () => {
  const item = newCappedSuppressionProposal("code-977", "label-938");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("CappedSuppressionProposal rejects moves from retired", () => {
  const item = newCappedSuppressionProposal("code-977", "label-938");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
