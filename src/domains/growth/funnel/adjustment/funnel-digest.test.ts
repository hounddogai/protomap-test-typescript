import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelDigest } from "./funnel-digest.js";

test("FunnelDigest starts in idle", () => {
  const item = newFunnelDigest("code-850", "title-980");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelDigest moves to draining", () => {
  const item = newFunnelDigest("code-850", "title-980");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("FunnelDigest rejects moves from stopped", () => {
  const item = newFunnelDigest("code-850", "title-980");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
