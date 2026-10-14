import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelProposal } from "./funnel-proposal.js";

test("FunnelProposal starts in idle", () => {
  const item = newFunnelProposal("code-738", "label-450");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelProposal moves to ready", () => {
  const item = newFunnelProposal("code-738", "label-450");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("FunnelProposal rejects moves from stopped", () => {
  const item = newFunnelProposal("code-738", "label-450");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
