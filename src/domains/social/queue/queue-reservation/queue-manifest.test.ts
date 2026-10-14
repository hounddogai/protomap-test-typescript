import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueManifest } from "./queue-manifest.js";

test("QueueManifest starts in idle", () => {
  const item = newQueueManifest("code-304", "name-175");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueManifest moves to ready", () => {
  const item = newQueueManifest("code-304", "name-175");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("QueueManifest rejects moves from stopped", () => {
  const item = newQueueManifest("code-304", "name-175");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
