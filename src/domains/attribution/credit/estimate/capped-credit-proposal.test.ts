import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedCreditProposal } from "./capped-credit-proposal.js";

test("CappedCreditProposal starts in planned", () => {
  const item = newCappedCreditProposal("code-537", "name-341");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedCreditProposal moves to completed", () => {
  const item = newCappedCreditProposal("code-537", "name-341");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("CappedCreditProposal rejects moves from cancelled", () => {
  const item = newCappedCreditProposal("code-537", "name-341");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
