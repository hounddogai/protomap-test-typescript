import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPreferenceProposal } from "./fallback-preference-proposal.js";

test("FallbackPreferenceProposal starts in idle", () => {
  const item = newFallbackPreferenceProposal("code-749", "title-702");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPreferenceProposal moves to ready", () => {
  const item = newFallbackPreferenceProposal("code-749", "title-702");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("FallbackPreferenceProposal rejects moves from stopped", () => {
  const item = newFallbackPreferenceProposal("code-749", "title-702");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
