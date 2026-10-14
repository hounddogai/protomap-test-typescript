import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointProposal } from "./touchpoint-proposal.js";

test("TouchpointProposal starts in idle", () => {
  const item = newTouchpointProposal("code-301", "name-423");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointProposal moves to ready", () => {
  const item = newTouchpointProposal("code-301", "name-423");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("TouchpointProposal rejects moves from stopped", () => {
  const item = newTouchpointProposal("code-301", "name-423");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
