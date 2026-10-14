import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalActivationProposal } from "./regional-activation-proposal.js";

test("RegionalActivationProposal starts in idle", () => {
  const item = newRegionalActivationProposal("code-430", "label-928");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalActivationProposal moves to ready", () => {
  const item = newRegionalActivationProposal("code-430", "label-928");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("RegionalActivationProposal rejects moves from stopped", () => {
  const item = newRegionalActivationProposal("code-430", "label-928");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
