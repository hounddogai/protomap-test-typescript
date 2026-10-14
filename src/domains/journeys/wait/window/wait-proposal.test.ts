import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitProposal } from "./wait-proposal.js";

test("WaitProposal starts in requested", () => {
  const item = newWaitProposal("code-943", "name-671");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitProposal moves to expired", () => {
  const item = newWaitProposal("code-943", "name-671");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("WaitProposal rejects moves from expired", () => {
  const item = newWaitProposal("code-943", "name-671");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
