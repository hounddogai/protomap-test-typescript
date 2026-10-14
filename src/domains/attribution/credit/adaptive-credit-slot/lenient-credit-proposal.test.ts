import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientCreditProposal } from "./lenient-credit-proposal.js";

test("LenientCreditProposal starts in planned", () => {
  const item = newLenientCreditProposal("code-125", "title-10");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientCreditProposal moves to completed", () => {
  const item = newLenientCreditProposal("code-125", "title-10");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("LenientCreditProposal rejects moves from cancelled", () => {
  const item = newLenientCreditProposal("code-125", "title-10");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
