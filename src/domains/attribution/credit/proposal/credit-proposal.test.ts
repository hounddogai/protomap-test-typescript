import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditProposal } from "./credit-proposal.js";

test("CreditProposal starts in created", () => {
  const item = newCreditProposal("code-588", "name-924");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditProposal moves to validated", () => {
  const item = newCreditProposal("code-588", "name-924");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("CreditProposal rejects moves from retired", () => {
  const item = newCreditProposal("code-588", "name-924");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
