import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePlacementManifest } from "./adaptive-placement-manifest.js";

test("AdaptivePlacementManifest starts in new", () => {
  const item = newAdaptivePlacementManifest("code-960", "label-876");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePlacementManifest moves to running", () => {
  const item = newAdaptivePlacementManifest("code-960", "label-876");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("AdaptivePlacementManifest rejects moves from failed", () => {
  const item = newAdaptivePlacementManifest("code-960", "label-876");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
