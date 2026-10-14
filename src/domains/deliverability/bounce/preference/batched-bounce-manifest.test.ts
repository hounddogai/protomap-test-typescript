import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedBounceManifest } from "./batched-bounce-manifest.js";

test("BatchedBounceManifest starts in open", () => {
  const item = newBatchedBounceManifest("code-586", "name-244");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedBounceManifest moves to archived", () => {
  const item = newBatchedBounceManifest("code-586", "name-244");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("BatchedBounceManifest rejects moves from archived", () => {
  const item = newBatchedBounceManifest("code-586", "name-244");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
