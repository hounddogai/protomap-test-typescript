import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictQueueManifest } from "./strict-queue-manifest.js";

test("StrictQueueManifest starts in new", () => {
  const item = newStrictQueueManifest("code-347", "title-801");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictQueueManifest moves to done", () => {
  const item = newStrictQueueManifest("code-347", "title-801");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("StrictQueueManifest rejects moves from failed", () => {
  const item = newStrictQueueManifest("code-347", "title-801");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
