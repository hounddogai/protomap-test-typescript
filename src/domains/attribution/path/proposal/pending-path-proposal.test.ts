import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingPathProposal } from "./pending-path-proposal.js";

test("PendingPathProposal starts in idle", () => {
  const item = newPendingPathProposal("code-61", "name-168");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingPathProposal moves to ready", () => {
  const item = newPendingPathProposal("code-61", "name-168");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PendingPathProposal rejects moves from stopped", () => {
  const item = newPendingPathProposal("code-61", "name-168");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
