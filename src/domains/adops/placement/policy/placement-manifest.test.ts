import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementManifest } from "./placement-manifest.js";

test("PlacementManifest starts in new", () => {
  const item = newPlacementManifest("code-117", "title-714");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementManifest moves to done", () => {
  const item = newPlacementManifest("code-117", "title-714");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PlacementManifest rejects moves from failed", () => {
  const item = newPlacementManifest("code-117", "title-714");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
