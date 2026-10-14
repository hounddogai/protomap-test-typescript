import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyRetentionDigest } from "./legacy-retention-digest.js";

test("LegacyRetentionDigest starts in idle", () => {
  const item = newLegacyRetentionDigest("code-543", "title-631");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyRetentionDigest moves to stopped", () => {
  const item = newLegacyRetentionDigest("code-543", "title-631");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("LegacyRetentionDigest rejects moves from stopped", () => {
  const item = newLegacyRetentionDigest("code-543", "title-631");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
