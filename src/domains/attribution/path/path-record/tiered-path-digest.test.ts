import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPathDigest } from "./tiered-path-digest.js";

test("TieredPathDigest starts in idle", () => {
  const item = newTieredPathDigest("code-167", "name-256");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPathDigest moves to warming", () => {
  const item = newTieredPathDigest("code-167", "name-256");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("TieredPathDigest rejects moves from stopped", () => {
  const item = newTieredPathDigest("code-167", "name-256");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
