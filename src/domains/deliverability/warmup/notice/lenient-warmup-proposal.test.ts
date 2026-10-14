import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientWarmupProposal } from "./lenient-warmup-proposal.js";

test("LenientWarmupProposal starts in idle", () => {
  const item = newLenientWarmupProposal("code-589", "name-974");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientWarmupProposal moves to stopped", () => {
  const item = newLenientWarmupProposal("code-589", "name-974");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("LenientWarmupProposal rejects moves from stopped", () => {
  const item = newLenientWarmupProposal("code-589", "name-974");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
