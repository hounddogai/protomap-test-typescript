import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveActivationProposal } from "./adaptive-activation-proposal.js";

test("AdaptiveActivationProposal starts in new", () => {
  const item = newAdaptiveActivationProposal("code-774", "label-979");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveActivationProposal moves to queued", () => {
  const item = newAdaptiveActivationProposal("code-774", "label-979");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("AdaptiveActivationProposal rejects moves from failed", () => {
  const item = newAdaptiveActivationProposal("code-774", "label-979");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
