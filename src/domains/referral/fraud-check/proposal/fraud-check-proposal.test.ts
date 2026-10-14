import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckProposal } from "./fraud-check-proposal.js";

test("FraudCheckProposal starts in open", () => {
  const item = newFraudCheckProposal("code-990", "label-343");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckProposal moves to resolved", () => {
  const item = newFraudCheckProposal("code-990", "label-343");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("FraudCheckProposal rejects moves from archived", () => {
  const item = newFraudCheckProposal("code-990", "label-343");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
