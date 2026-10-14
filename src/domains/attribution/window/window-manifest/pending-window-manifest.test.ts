import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingWindowManifest } from "./pending-window-manifest.js";

test("PendingWindowManifest starts in new", () => {
  const item = newPendingWindowManifest("code-137", "title-665");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingWindowManifest moves to done", () => {
  const item = newPendingWindowManifest("code-137", "title-665");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PendingWindowManifest rejects moves from failed", () => {
  const item = newPendingWindowManifest("code-137", "title-665");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
