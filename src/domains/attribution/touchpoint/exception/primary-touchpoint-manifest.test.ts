import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryTouchpointManifest } from "./primary-touchpoint-manifest.js";

test("PrimaryTouchpointManifest starts in new", () => {
  const item = newPrimaryTouchpointManifest("code-221", "label-598");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryTouchpointManifest moves to running", () => {
  const item = newPrimaryTouchpointManifest("code-221", "label-598");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PrimaryTouchpointManifest rejects moves from failed", () => {
  const item = newPrimaryTouchpointManifest("code-221", "label-598");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
