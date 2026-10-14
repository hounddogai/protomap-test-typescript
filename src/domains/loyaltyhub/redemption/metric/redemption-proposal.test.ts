import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionProposal } from "./redemption-proposal.js";

test("RedemptionProposal starts in idle", () => {
  const item = newRedemptionProposal("code-209", "label-653");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionProposal moves to ready", () => {
  const item = newRedemptionProposal("code-209", "label-653");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("RedemptionProposal rejects moves from stopped", () => {
  const item = newRedemptionProposal("code-209", "label-653");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
